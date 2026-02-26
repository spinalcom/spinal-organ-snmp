import { EventEmitter } from "node:events";
import { SpinalQueue } from "spinal-connector-service";
import { STATES, SpinalSNMPDiscover, SpinalSNMPNetwork } from "spinal-model-snmp";
import { config } from "../config";
import SnmpUtils from "../utilities/SnmpUtils";
import { IOidTreeNode, isSuccessfulDiscover } from "../types";
import { v4 as uuidv4 } from "uuid";
import { SPINAL_RELATION_PTR_LST_TYPE, SpinalContext, SpinalNode } from "spinal-model-graph";
import { InputDataDevice, SpinalBmsDevice } from "spinal-model-bmsnetwork";
import { _getNodeAlreadyInGraph, addAllEndpointsToDevice } from "../utilities/transformTreeToGraph";

class SpinalDiscover extends EventEmitter {
    private static _instance: SpinalDiscover;

    private discoverRequestsQueue: SpinalQueue<SpinalSNMPDiscover> = new SpinalQueue();

    private processing: boolean = false;

    private constructor() {
        super();
        this._listenQueueStartEvent(this.startDiscoverQueueProcessing.bind(this));

        this.on("discoverNextInQueue", this._discoverNextInQueue.bind(this));

        this.on("discoverQueueFinished", () => this.processing = false);
    }

    public static getInstance(): SpinalDiscover {
        if (!SpinalDiscover._instance) {
            SpinalDiscover._instance = new SpinalDiscover();
        }
        return SpinalDiscover._instance;
    }

    public startDiscoverQueueProcessing() {
        if (this.processing) return;

        this.processing = true;
        this.emit("discoverNextInQueue");
    }

    public async addToDiscoverQueue(discoverModel: SpinalSNMPDiscover) {
        return this.discoverRequestsQueue.addToQueue(discoverModel);
    }


    private _listenQueueStartEvent(callback: (args: any[]) => void) {
        this.discoverRequestsQueue.on("start", callback);
    }


    private async _discoverNextInQueue() {
        if (this.discoverRequestsQueue.isEmpty()) {
            this.emit("discoverQueueFinished");
            return;
        }

        const discoverModel = this.discoverRequestsQueue.dequeue();
        await this._bindDiscoverModelState(discoverModel);
        discoverModel.changeState(STATES.discovering);
    }

    /**
     * Bind discover model to execute appropriate actions on state changes
     * @param discoverModel 
     */
    private _bindDiscoverModelState(discoverModel: SpinalSNMPDiscover): Promise<void> {
        return discoverModel.state.bind(async () => {
            const state = discoverModel.state.get();
            switch (state) {
                case STATES.discovering:
                    this.discoverNetworks(discoverModel);
                    break;

                case STATES.readyToCreate:
                    await this._createNetworkInGraph(discoverModel);
                    break;

                case STATES.error:
                case STATES.timeout:
                case STATES.discovered:
                    this.emit("discoverNextInQueue");
                    break;
            }
        })
    }


    private async discoverNetworks(model: SpinalSNMPDiscover) {
        const networks = model.networks;
        let index = 0;
        const discovered: IOidTreeNode[] = [];

        try {
            let isCancelled = this._discoveredIsCancelled(model);

            while (index < networks.length && !isCancelled) {
                const network = networks[index];
                try {
                    console.log("Discovering network", network.address.get());
                    const tree = await this._discoverNetwork(network);
                    discovered.push(tree);
                    const count = model.progress.finished.get() || 0;
                    model.progress.finished.set(count + 1);
                    console.log("Finished discovering network", network.address.get());
                } catch (error) {
                    console.log("Discovery error for network", network.address.get(), ":", (error as Error).message);
                    const count = model.progress.failed.get() || 0;
                    model.progress.failed.set(count + 1);
                }

                index++;
                isCancelled = this._discoveredIsCancelled(model)

            }

            if (isCancelled) return;

            if (discovered.length === 0) throw new Error("No networks found");

            model.setTreeDiscovered({ oid: uuidv4(), discovered, name: "Root", children: discovered });
            await model.changeState(STATES.discovered);
            return discovered;

        } catch (error) {
            await model.changeState(STATES.error);
        }
    }

    private async _discoverNetwork(network: SpinalSNMPNetwork): Promise<SpinalSNMPDiscover> {
        const mibData = await this._getMibDataAsJson(network);
        const ip = network.address.get();
        const discoverResult = await SnmpUtils.getInstance().discover(ip, "public", mibData);

        if (!isSuccessfulDiscover(discoverResult)) throw discoverResult.error;

        return this._formatDiscoverResultAsTree(discoverResult, network);
    }

    private async _createNetworkInGraph(discoverModel: SpinalSNMPDiscover): Promise<SpinalNode | void> {
        try {
            console.log("Creating network in graph");
            const rootTree = await discoverModel.getTreeToCreate(config.hubUrl);
            const treeToCreate = rootTree?.children[0] || null;

            const { context, organ } = await this._getContextAndOrgan(discoverModel);

            const deviceNode = await this._getOrCreateDeviceNode(context, organ, treeToCreate);

            const nodeAlreadyInGraph = await _getNodeAlreadyInGraph(context, deviceNode);

            await addAllEndpointsToDevice(context, treeToCreate.children, deviceNode, nodeAlreadyInGraph);


            return this._addDeviceToOrgan(organ, context, deviceNode).then(() => {
                discoverModel.changeState(STATES.created);
                console.log("Network created in graph");
                return deviceNode;
            })
        } catch (error) {
            console.log("Error creating network in graph:", (error as Error).message);
            discoverModel.changeState(STATES.error);
        }

    }


    private async _addDeviceToOrgan(organ: SpinalNode, context: SpinalContext, deviceNode: SpinalNode): Promise<SpinalNode | void> {
        try {
            return organ.addChildInContext(deviceNode, SpinalBmsDevice.relationName, SPINAL_RELATION_PTR_LST_TYPE, context);
        } catch (error) { }
    }

    private _getContextAndOrgan(discoverModel: SpinalSNMPDiscover): Promise<{ context: SpinalContext, organ: SpinalNode }> {
        return Promise.all([discoverModel.getContext(), discoverModel.getOrgan()]).then(([context, organ]) => ({ context, organ }));
    }

    private async _getMibDataAsJson(network: SpinalSNMPNetwork) {
        try {
            const mibFile = await network.getMibData(config.hubUrl);
            if (!mibFile) return;

            const dataBuffer = Buffer.from(mibFile);
            const utf16Decoder = new TextDecoder("utf-8");

            return JSON.parse(utf16Decoder.decode(dataBuffer));
        } catch (error) {
            return;
        }

    }

    private _discoveredIsCancelled(_discoverModel: SpinalSNMPDiscover): boolean {
        return !_discoverModel || _discoverModel.state?.get() !== STATES.discovering;
    }

    private _formatDiscoverResultAsTree(discoverResult: any, network: SpinalSNMPNetwork) {
        return {
            oid: network.address?.get(),
            name: network.name?.get(),
            address: network.address?.get(),
            children: SnmpUtils.getInstance().convertOidsToTree(discoverResult.oids)
        };
    }


    private async _getOrCreateDeviceNode(context: SpinalContext, organ: SpinalNode, treeToCreate: IOidTreeNode): Promise<SpinalNode> {
        const { name, address } = treeToCreate;
        const deviceNodes = await organ.getChildrenInContext(context, [SpinalBmsDevice.relationName]);

        const deviceFound = deviceNodes.find((node) => node.info.address.get() === address);
        if (deviceFound) return deviceFound;

        const info = {
            id: address,
            name,
            type: SpinalBmsDevice.nodeTypeName,
            path: "",
            address,
        } as InputDataDevice;

        const bmsModel = new SpinalBmsDevice(info);
        const node = new SpinalNode(name, SpinalBmsDevice.nodeTypeName, bmsModel);

        node.info.add_attr({
            idNetwork: info.id,
            address: info.address,
        })

        return node;
        // return organ.addChildInContext(node, SpinalBmsDevice.relationName, SPINAL_RELATION_PTR_LST_TYPE, context);
    }


}


export default SpinalDiscover;
export { SpinalDiscover };