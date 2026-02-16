"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalSNMPDiscover = void 0;
const spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
const uuid_1 = require("uuid");
const constants_1 = require("./constants");
class SpinalSNMPDiscover extends spinal_core_connectorjs_1.Model {
    constructor(graph, context, network, organ) {
        super();
        if (!graph || !context || !network || !organ)
            return;
        this.add_attr({
            id: (0, uuid_1.v4)(),
            graph: graph && new spinal_core_connectorjs_1.Pbr(graph),
            context: context && new spinal_core_connectorjs_1.Pbr(context),
            network: network && new spinal_core_connectorjs_1.Pbr(network),
            organ: organ && new spinal_core_connectorjs_1.Pbr(organ),
            creation: Date.now(),
            state: constants_1.STATES.reseted
        });
    }
    setDiscoveringMode() {
        this.state.set(constants_1.STATES.discovering);
    }
    setDiscoveredMode() {
        this.state.set(constants_1.STATES.discovered);
    }
    setResetedMode() {
        this.state.set(constants_1.STATES.reseted);
    }
    setTimeoutMode() {
        this.state.set(constants_1.STATES.timeout);
    }
    setCreatingMode() {
        this.state.set(constants_1.STATES.creating);
    }
    setCreatedMode() {
        this.state.set(constants_1.STATES.created);
    }
    setErrorMode() {
        this.state.set(constants_1.STATES.error);
    }
    async getOrgan() {
        return new Promise((resolve, reject) => {
            return this.organ.load((organ) => {
                resolve(organ);
            });
        });
    }
    addToGraph() {
        return this.getOrgan().then(async (organNode) => {
            const organ = await organNode.getElement(true);
            return organ.addDiscoverModelToGraph(this);
        });
    }
    remove() {
        return this.getOrgan().then(async (organNode) => {
            const organ = await organNode.getElement(true);
            return organ.removeDiscoverModelFromGraph(this);
        });
    }
}
exports.SpinalSNMPDiscover = SpinalSNMPDiscover;
spinal_core_connectorjs_1.spinalCore.register_models([SpinalSNMPDiscover]);
exports.default = SpinalSNMPDiscover;
//# sourceMappingURL=SpinalSNMPDiscover.js.map