"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalDiscover = void 0;
const node_events_1 = require("node:events");
const spinal_connector_service_1 = require("spinal-connector-service");
const spinal_model_snmp_1 = require("spinal-model-snmp");
const config_1 = require("../config");
const SnmpUtils_1 = require("../utilities/SnmpUtils");
const types_1 = require("../types");
const uuid_1 = require("uuid");
const spinal_model_graph_1 = require("spinal-model-graph");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const transformTreeToGraph_1 = require("../utilities/transformTreeToGraph");
class SpinalDiscover extends node_events_1.EventEmitter {
    constructor() {
        super();
        this.discoverRequestsQueue = new spinal_connector_service_1.SpinalQueue();
        this.processing = false;
        this._listenQueueStartEvent(this.startDiscoverQueueProcessing.bind(this));
        this.on("discoverNextInQueue", this._discoverNextInQueue.bind(this));
        this.on("discoverQueueFinished", () => this.processing = false);
    }
    static getInstance() {
        if (!SpinalDiscover._instance) {
            SpinalDiscover._instance = new SpinalDiscover();
        }
        return SpinalDiscover._instance;
    }
    startDiscoverQueueProcessing() {
        if (this.processing)
            return;
        this.processing = true;
        this.emit("discoverNextInQueue");
    }
    async addToDiscoverQueue(discoverModel) {
        return this.discoverRequestsQueue.addToQueue(discoverModel);
    }
    _listenQueueStartEvent(callback) {
        this.discoverRequestsQueue.on("start", callback);
    }
    async _discoverNextInQueue() {
        if (this.discoverRequestsQueue.isEmpty()) {
            this.emit("discoverQueueFinished");
            return;
        }
        const discoverModel = this.discoverRequestsQueue.dequeue();
        await this._bindDiscoverModelState(discoverModel);
        discoverModel.changeState(spinal_model_snmp_1.STATES.discovering);
    }
    /**
     * Bind discover model to execute appropriate actions on state changes
     * @param discoverModel
     */
    _bindDiscoverModelState(discoverModel) {
        return discoverModel.state.bind(async () => {
            const state = discoverModel.state.get();
            switch (state) {
                case spinal_model_snmp_1.STATES.discovering:
                    this.discoverNetworks(discoverModel);
                    break;
                case spinal_model_snmp_1.STATES.readyToCreate:
                    await this._createNetworkInGraph(discoverModel);
                    break;
                case spinal_model_snmp_1.STATES.error:
                case spinal_model_snmp_1.STATES.timeout:
                case spinal_model_snmp_1.STATES.discovered:
                    this.emit("discoverNextInQueue");
                    break;
            }
        });
    }
    async discoverNetworks(model) {
        const networks = model.networks;
        let index = 0;
        const discovered = [];
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
                }
                catch (error) {
                    console.log("Discovery error for network", network.address.get(), ":", error.message);
                    const count = model.progress.failed.get() || 0;
                    model.progress.failed.set(count + 1);
                }
                index++;
                isCancelled = this._discoveredIsCancelled(model);
            }
            if (isCancelled)
                return;
            if (discovered.length === 0)
                throw new Error("No networks found");
            model.setTreeDiscovered({ oid: (0, uuid_1.v4)(), discovered, name: "Root", children: discovered });
            await model.changeState(spinal_model_snmp_1.STATES.discovered);
            return discovered;
        }
        catch (error) {
            await model.changeState(spinal_model_snmp_1.STATES.error);
        }
    }
    async _discoverNetwork(network) {
        const mibData = await this._getMibDataAsJson(network);
        const ip = network.address.get();
        const discoverResult = await SnmpUtils_1.default.getInstance().discover(ip, "public", mibData);
        if (!(0, types_1.isSuccessfulDiscover)(discoverResult))
            throw discoverResult.error;
        return this._formatDiscoverResultAsTree(discoverResult, network);
    }
    async _createNetworkInGraph(discoverModel) {
        try {
            console.log("Creating network in graph");
            const rootTree = await discoverModel.getTreeToCreate(config_1.config.hubUrl);
            const treeToCreate = rootTree?.children[0] || null;
            const { context, organ } = await this._getContextAndOrgan(discoverModel);
            const deviceNode = await this._getOrCreateDeviceNode(context, organ, treeToCreate);
            const nodeAlreadyInGraph = await (0, transformTreeToGraph_1._getNodeAlreadyInGraph)(context, deviceNode);
            await (0, transformTreeToGraph_1.addAllEndpointsToDevice)(context, treeToCreate.children, deviceNode, nodeAlreadyInGraph);
            return this._addDeviceToOrgan(organ, context, deviceNode).then(() => {
                discoverModel.changeState(spinal_model_snmp_1.STATES.created);
                console.log("Network created in graph");
                return deviceNode;
            });
        }
        catch (error) {
            console.log("Error creating network in graph:", error.message);
            discoverModel.changeState(spinal_model_snmp_1.STATES.error);
        }
    }
    async _addDeviceToOrgan(organ, context, deviceNode) {
        try {
            return organ.addChildInContext(deviceNode, spinal_model_bmsnetwork_1.SpinalBmsDevice.relationName, spinal_model_graph_1.SPINAL_RELATION_PTR_LST_TYPE, context);
        }
        catch (error) { }
    }
    _getContextAndOrgan(discoverModel) {
        return Promise.all([discoverModel.getContext(), discoverModel.getOrgan()]).then(([context, organ]) => ({ context, organ }));
    }
    async _getMibDataAsJson(network) {
        try {
            const mibFile = await network.getMibData(config_1.config.hubUrl);
            if (!mibFile)
                return;
            const dataBuffer = Buffer.from(mibFile);
            const utf16Decoder = new TextDecoder("utf-8");
            return JSON.parse(utf16Decoder.decode(dataBuffer));
        }
        catch (error) {
            return;
        }
    }
    _discoveredIsCancelled(_discoverModel) {
        return !_discoverModel || _discoverModel.state?.get() !== spinal_model_snmp_1.STATES.discovering;
    }
    _formatDiscoverResultAsTree(discoverResult, network) {
        return {
            oid: network.address?.get(),
            name: network.name?.get(),
            address: network.address?.get(),
            children: SnmpUtils_1.default.getInstance().convertOidsToTree(discoverResult.oids)
        };
    }
    async _getOrCreateDeviceNode(context, organ, treeToCreate) {
        const { name, address } = treeToCreate;
        const deviceNodes = await organ.getChildrenInContext(context, [spinal_model_bmsnetwork_1.SpinalBmsDevice.relationName]);
        const deviceFound = deviceNodes.find((node) => node.info.address.get() === address);
        if (deviceFound)
            return deviceFound;
        const info = {
            id: address,
            name,
            type: spinal_model_bmsnetwork_1.SpinalBmsDevice.nodeTypeName,
            path: "",
            address,
        };
        const bmsModel = new spinal_model_bmsnetwork_1.SpinalBmsDevice(info);
        const node = new spinal_model_graph_1.SpinalNode(name, spinal_model_bmsnetwork_1.SpinalBmsDevice.nodeTypeName, bmsModel);
        node.info.add_attr({
            idNetwork: info.id,
            address: info.address,
        });
        return node;
        // return organ.addChildInContext(node, SpinalBmsDevice.relationName, SPINAL_RELATION_PTR_LST_TYPE, context);
    }
}
exports.SpinalDiscover = SpinalDiscover;
exports.default = SpinalDiscover;
//# sourceMappingURL=SpinalDiscover.js.map