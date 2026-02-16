"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalDevice = void 0;
const node_events_1 = require("node:events");
const SnmpUtils_1 = require("../utilities/SnmpUtils");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const spinal_model_timeseries_1 = require("spinal-model-timeseries");
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const transformTreeToGraph_1 = require("../utilities/transformTreeToGraph");
const timeSeries = new spinal_model_timeseries_1.default();
class SpinalDevice extends node_events_1.EventEmitter {
    constructor(context, organ, network, deviceNode, listenerModel, profileData) {
        super();
        this.allEndpoints = {};
        this._context = context;
        this._organ = organ;
        this._network = network;
        this.deviceNode = deviceNode;
        this._info = network.info.get();
        this.profileData = profileData;
        this.listenerModel = listenerModel;
    }
    async init() {
        const endpoints = await this.deviceNode.getChildren(spinal_model_bmsnetwork_1.SpinalBmsEndpoint.relationName);
        for (const endpoint of endpoints) {
            const id = endpoint.info.get().idNetwork;
            this.allEndpoints[id] = endpoint;
        }
        return endpoints;
    }
    async updateEndpointsValue(interval) {
        const target = await this.deviceNode.info?.address?.get();
        if (!target) {
            console.error(`Device ${this.deviceNode.info.get().name} does not have an address, cannot update endpoints value.`);
            return;
        }
        const nodeToUpdate = this._getNodeToUpdate(interval);
        const oids = nodeToUpdate.map(item => item.idNetwork);
        const values = await SnmpUtils_1.default.getInstance().getOidsValuesAsObject(target, oids);
        return this._updateEndpointInGraph(nodeToUpdate, values);
    }
    async startMonitoringWithCov(nodesToUpdate) {
        await this._initReceiver();
    }
    async _initReceiver() {
        if (this._snmpReceiver)
            return;
        const [address, port] = this.deviceNode.info.address.get().split(":");
        const options = {
            port: parseInt(port) || 162,
            address,
            transport: "udp4",
        };
        this._snmpReceiver = SnmpUtils_1.default.getInstance().createReceiver(options, (error, notification) => {
            if (error) {
                console.error(`Error in SNMP receiver for device ${this.deviceNode.info.get().name}:`, error);
                return;
            }
            console.log(`Received SNMP notification for device ${this.deviceNode.info.get().name}:`, notification);
        });
    }
    _getNodeToUpdate(interval) {
        const intervalFound = this.profileData.intervals.find(item => item.node.value === interval);
        if (!intervalFound)
            return [];
        return intervalFound.nodeToUpdate;
    }
    _updateEndpointInGraph(nodesToUpdate, values) {
        const promises = nodesToUpdate.map(async (nodeToUpdate) => {
            const value = values[nodeToUpdate.idNetwork];
            if (typeof value === "undefined")
                return;
            let node = this.allEndpoints[nodeToUpdate.idNetwork];
            if (!node) {
                node = await await this._createEndpointNode(nodeToUpdate);
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
        });
    }
    async _setEndpointValue(node, value) {
        const element = await node.getElement(true);
        if (!element)
            return;
        element.currentValue.set(value);
    }
    _saveTimeSeries(node, value) {
        spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node); // save the node in the graph service to be able to use it in the timeseries service
        return timeSeries.pushFromEndpoint(node.getId().get(), value);
    }
    async _createEndpointNode(endpointInfo) {
        endpointInfo.oid = endpointInfo.idNetwork; // we set the oid to be the idNetwork to easily access it later, we can do this because idNetwork is unique in the device
        return (0, transformTreeToGraph_1.createAndAddEndpointsToDevice)(this._context, endpointInfo, this.deviceNode);
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
exports.SpinalDevice = SpinalDevice;
exports.default = SpinalDevice;
//# sourceMappingURL=SpinalDevice.js.map