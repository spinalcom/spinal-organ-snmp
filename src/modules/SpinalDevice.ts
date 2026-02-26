import { EventEmitter } from "node:events";
import { IOidsItem, IProfile, IOidTreeNode, NodeToUpdate } from "../types";
import { SpinalContext, SpinalNode } from "spinal-model-graph";
import { SpinalSNMPListner } from "spinal-model-snmp";
import SnmpUtils from "../utilities/SnmpUtils";
import { SpinalBmsEndpoint } from "spinal-model-bmsnetwork";
import SpinalServiceTimeseries from "spinal-model-timeseries";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { createAndAddEndpointsToDevice } from "../utilities/transformTreeToGraph";
import * as snmp from "net-snmp";

const timeSeries = new SpinalServiceTimeseries();

class SpinalDevice extends EventEmitter {

    private _info: IOidsItem;
    private _context: SpinalContext;
    private _organ: SpinalNode;
    private _network: SpinalNode;
    private _snmpReceiver: snmp.Receiver; // to be defined when we implement the COV monitoring
    public listenerModel: SpinalSNMPListner;

    public deviceNode: SpinalNode;
    public profileData: IProfile;

    public allEndpoints: { [key: string]: SpinalNode } = {};


    public constructor(context: SpinalContext, organ: SpinalNode, network: SpinalNode, deviceNode: SpinalNode, listenerModel: SpinalSNMPListner, profileData: IProfile) {
        super();

        this._context = context;
        this._organ = organ;
        this._network = network;
        this.deviceNode = deviceNode;

        this._info = network.info.get();
        this.profileData = profileData;
        this.listenerModel = listenerModel;
    }

    public async init() {
        const endpoints = await this.deviceNode.getChildren(SpinalBmsEndpoint.relationName);
        for (const endpoint of endpoints) {
            const id = endpoint.info.get().idNetwork;
            this.allEndpoints[id] = endpoint;
        }

        return endpoints;
    }


    public async updateEndpointsValue(interval: number) {
        try {
            const target = await this.deviceNode.info?.address?.get();

            if (!target) {
                console.error(`Device ${this.deviceNode.info.get().name} does not have an address, cannot update endpoints value.`);
                return;
            }

            const nodeToUpdate = this._getNodeToUpdate(interval);
            const oids = nodeToUpdate.map(item => item.idNetwork);

            const values = await SnmpUtils.getInstance().getOidsValuesAsObject(target, oids);
            return this._updateEndpointInGraph(nodeToUpdate, values);
        } catch (error) {
            console.error(`Error updating endpoints value for device [${this.deviceNode.info.get().name}] due to:`, (error as Error).message);
        }

    }


    public async startMonitoringWithCov(nodesToUpdate: NodeToUpdate[]) {
        await this._initReceiver();
    }

    public async _initReceiver() {
        if (this._snmpReceiver) return;

        const [address, port] = this.deviceNode.info.address.get().split(":");

        const options = {
            port: parseInt(port) || 162,
            address,
            transport: "udp4",
        };

        this._snmpReceiver = SnmpUtils.getInstance().createReceiver(options, (error, notification) => {
            if (error) {
                console.error(`Error in SNMP receiver for device ${this.deviceNode.info.get().name}:`, error);
                return;
            }

            console.log(`Received SNMP notification for device ${this.deviceNode.info.get().name}:`, notification);
        });

    }


    private _getNodeToUpdate(interval: number): NodeToUpdate[] {
        const intervalFound = this.profileData.intervals.find(item => item.node.value === interval);
        if (!intervalFound) return [];

        return intervalFound.nodeToUpdate;
    }


    private _updateEndpointInGraph(nodesToUpdate: NodeToUpdate[], values: { [key: string]: any }) {
        const promises = nodesToUpdate.map(async (nodeToUpdate) => {

            const value = values[nodeToUpdate.idNetwork];
            if (typeof value === "undefined") return;

            let node = this.allEndpoints[nodeToUpdate.idNetwork];

            if (!node) {
                node = await await this._createEndpointNode(nodeToUpdate as any);
                this.allEndpoints[nodeToUpdate.idNetwork] = node;
            }

            await this._setEndpointValue(node, value);

            if (nodeToUpdate.saveTimeSeries && (typeof value === "number" || typeof value === "boolean")) {
                await this._saveTimeSeries(node, value);
            }

            return value;
        });

        return Promise.all(promises).then(() => {
            console.log(`${new Date()} Device ${this.deviceNode.info.get().name} updated.`);
        }).catch((err) => {
            console.error(`Error updating endpoints value for device [${this.deviceNode.info.get().name}] due to:`, (err as Error).message);
        });
    }

    private async _setEndpointValue(node: SpinalNode, value: number | boolean | string) {
        const element: SpinalBmsEndpoint = await node.getElement(true);
        if (!element) return;

        element.currentValue.set(value);
    }

    private _saveTimeSeries(node: SpinalNode, value: number | boolean) {
        SpinalGraphService._addNode(node); // save the node in the graph service to be able to use it in the timeseries service
        return timeSeries.pushFromEndpoint(node.getId().get(), value);
    }

    private async _createEndpointNode(endpointInfo: IOidTreeNode): Promise<SpinalNode> {
        endpointInfo.oid = (endpointInfo as any).idNetwork; // we set the oid to be the idNetwork to easily access it later, we can do this because idNetwork is unique in the device
        return createAndAddEndpointsToDevice(this._context, endpointInfo, this.deviceNode);
    }

    stopMonitoring() {
        this.listenerModel.monitored.set(false);
    }

    startMonitoring() {
        this.listenerModel.monitored.set(true);
    }

    restartMonitoring() {
        this.stopMonitoring();
        setTimeout(() => {
            this.startMonitoring();
        }, 1000);
    }

}


export default SpinalDevice;
export { SpinalDevice };