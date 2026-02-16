"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalSNMPPilot = void 0;
const spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
const uuid_1 = require("uuid");
class SpinalSNMPPilot extends spinal_core_connectorjs_1.Model {
    constructor(organ, request) {
        super();
        if (!organ || !request)
            return;
        this.add_attr({
            id: (0, uuid_1.v4)(),
            state: new spinal_core_connectorjs_1.Choice(0, ["init", "processing", "success", "error"]),
            organ: new spinal_core_connectorjs_1.Pbr(organ),
            request: Array.isArray(request) ? new spinal_core_connectorjs_1.Lst(request) : new spinal_core_connectorjs_1.Lst([request])
        });
    }
    setInitMode() {
        this.state.set("init");
    }
    setProcessMode() {
        this.state.set("processing");
    }
    setSuccessMode() {
        this.state.set("success");
    }
    setErrorMode() {
        this.state.set("error");
    }
    getOrgan() {
        return new Promise((resolve, reject) => {
            this.organ.load(value => resolve(value));
        });
    }
    addToGraph() {
        return this.getOrgan().then(async (organNode) => {
            const organModel = await organNode.getElement(true);
            if (organModel) {
                return organModel.addPilotToGraph(this);
            }
        });
    }
    removeFromGraph() {
        return this.getOrgan().then(async (organNode) => {
            const organModel = await organNode.getElement(true);
            if (organModel) {
                return organModel.removePilotModelFromGraph(this);
            }
        });
    }
    addToNode(endpoint) {
        return new Promise((resolve) => {
            if (!endpoint.info.pilot) {
                const model = new spinal_core_connectorjs_1.Lst();
                model.push(this);
                endpoint.info.add_attr({ pilot: new spinal_core_connectorjs_1.Ptr(model) });
                resolve(model);
            }
            else {
                endpoint.info.pilot.load(lst => {
                    lst.push(this);
                    resolve(lst);
                });
            }
        }).then((res) => {
            this.add_attr({ node: endpoint });
            return res;
        });
    }
    removeFromNode() {
        return new Promise((resolve, reject) => {
            if (this.node) {
                this.node.info.pilot.load(lst => {
                    for (let i = 0; i < lst.length; i++) {
                        const element = lst[i];
                        if (element.id.get() === this.id.get()) {
                            lst.splice(i);
                            break;
                        }
                    }
                    resolve(true);
                });
            }
            else {
                resolve(false);
            }
        });
    }
}
exports.SpinalSNMPPilot = SpinalSNMPPilot;
spinal_core_connectorjs_1.spinalCore.register_models([SpinalSNMPPilot]);
exports.default = SpinalSNMPPilot;
//# sourceMappingURL=SpinalSNMPPilot.js.map