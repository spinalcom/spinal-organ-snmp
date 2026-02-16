"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalSNMPListener = void 0;
const spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
const uuid_1 = require("uuid");
class SpinalSNMPListener extends spinal_core_connectorjs_1.Model {
    constructor(graph, context, organ, network, bmsDevice, profile, saveTimeSeries = false) {
        super();
        if (!graph || !context || !organ || !network || !bmsDevice || !profile)
            return;
        this.add_attr({
            id: (0, uuid_1.v4)(),
            monitored: true,
            saveTimeSeries: saveTimeSeries,
            network: new spinal_core_connectorjs_1.Pbr(network),
            organ: new spinal_core_connectorjs_1.Pbr(organ),
            context: new spinal_core_connectorjs_1.Pbr(context),
            graph: new spinal_core_connectorjs_1.Pbr(graph),
            bmsDevice: new spinal_core_connectorjs_1.Pbr(bmsDevice),
            profile: new spinal_core_connectorjs_1.Pbr(profile),
        });
    }
    getAllData() {
        const promises = [this.getGraph(), this.getOrgan(), this.getContext(), this.getBmsDevice(), this.getNetwork(), this.getProfile()];
        return Promise.all(promises).then(([graph, organ, context, device, network, profile]) => {
            return { graph, organ, context, device, network, profile };
        });
    }
    getGraph() {
        return this._loadData('graph');
    }
    getOrgan() {
        return this._loadData('organ');
    }
    getContext() {
        return this._loadData('context');
    }
    getBmsDevice() {
        return this._loadData('bmsDevice');
    }
    getNetwork() {
        return this._loadData('network');
    }
    getProfile() {
        return this._loadData('profile');
    }
    addToGraph() {
        return this.getOrgan().then(async (organNode) => {
            const organModel = await organNode.getElement(true);
            if (organModel) {
                await this.addToDevice(); // add reference to listener in device
                return organModel.addListenerModelToGraph(this); // add listener to organ listener list
            }
        });
    }
    removeFromGraph() {
        const promises = [this.getOrgan(), this.getBmsDevice()];
        return Promise.all(promises).then(async ([organNode, deviceNode]) => {
            const organModel = await organNode.getElement(true);
            if (organModel) {
                deviceNode.info.remove_attr('listener'); // remove reference to listener in device
                return organModel.removeListenerModelFromGraph(this); // remove listener from organ listener list
            }
        });
    }
    addToDevice() {
        return this.getBmsDevice().then((device) => {
            if (device.info.listeners)
                device.info.rem_attr('listener');
            device.info.add_attr({ listener: new spinal_core_connectorjs_1.Pbr(this) });
        });
    }
    _loadData(dataName) {
        return new Promise((resolve, reject) => {
            try {
                if (this[dataName] === undefined)
                    throw new Error(`${dataName} not found`);
                this[dataName].load((data) => resolve(data));
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.SpinalSNMPListener = SpinalSNMPListener;
spinal_core_connectorjs_1.spinalCore.register_models([SpinalSNMPListener]);
exports.default = SpinalSNMPListener;
//# sourceMappingURL=SpinalSNMPListener.js.map