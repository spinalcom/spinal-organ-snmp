"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalOrganSNMP = void 0;
const spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
const constants_1 = require("./constants");
const uuid_1 = require("uuid");
const modelsToBind_1 = require("./modelsToBind");
class SpinalOrganSNMP extends spinal_core_connectorjs_1.Model {
    constructor(name, type = constants_1.SNMP_ORGAN_TYPE) {
        super();
        if (!name)
            return;
        this.add_attr({
            id: (0, uuid_1.v4)(),
            name,
            type,
            references: {},
            restart: false,
            discover: new modelsToBind_1.default(),
            pilot: new modelsToBind_1.default(),
            listener: new modelsToBind_1.default(),
        });
    }
    _initializeModelsList() {
        if (!this.discover)
            this.add_attr({ discover: new modelsToBind_1.default() });
        if (!this.pilot)
            this.add_attr({ pilot: new modelsToBind_1.default() });
        if (!this.listener)
            this.add_attr({ listener: new modelsToBind_1.default() });
    }
    getModels() {
        this._initializeModelsList();
        return { discover: this.discover, pilot: this.pilot, listener: this.listener };
    }
    addReference(contextId, spinalNode) {
        if (this.references[contextId]) {
            return new Promise((resolve, reject) => {
                this.references[contextId].load((e) => {
                    if (typeof e !== "undefined")
                        return reject("The organ is already linked to this context");
                    this.references.mod_attr(contextId, new spinal_core_connectorjs_1.Ptr(spinalNode));
                    resolve(spinalNode);
                });
            });
        }
        this.references.add_attr({ [contextId]: new spinal_core_connectorjs_1.Ptr(spinalNode) });
        return Promise.resolve(spinalNode);
    }
    isReferencedInContext(contextId) {
        if (typeof this.references[contextId] === "undefined")
            return Promise.resolve(false);
        return new Promise((resolve, reject) => {
            this.references[contextId].load((e) => {
                if (typeof e === "undefined")
                    return resolve(false);
                resolve(true);
            });
        });
    }
    removeReference(contextId) {
        if (this.references[contextId]) {
            return new Promise((resolve, reject) => {
                this.references[contextId].load((node) => {
                    this.references.rem_attr(contextId);
                    resolve(node);
                });
            });
        }
    }
    //// ADD MODELS
    addDiscoverModelToGraph(discoverModel) {
        this._initializeModelsList();
        return this.discover.addModel(discoverModel);
    }
    addPilotModelToGraph(discoverModel) {
        this._initializeModelsList();
        return this.pilot.addModel(discoverModel);
    }
    addListenerModelToGraph(discoverModel) {
        this._initializeModelsList();
        return this.listener.addModel(discoverModel);
    }
    //// REMOVE MODELS
    removeDiscoverModelFromGraph(discoverModel) {
        if (this.discover)
            return this.discover.removeModel(discoverModel);
    }
    removePilotModelFromGraph(discoverModel) {
        if (this.pilot)
            return this.pilot.removeModel(discoverModel);
    }
    removeListenerModelFromGraph(discoverModel) {
        this._initializeModelsList();
        if (this.listener)
            return this.listener.removeModel(discoverModel);
    }
    //// GET MODELS
    getDiscoverModelFromGraph() {
        this._initializeModelsList();
        return this.discover.getModels();
    }
    getPilotModelFromGraph() {
        this._initializeModelsList();
        return this.pilot.getModels();
    }
    getListenerModelFromGraph() {
        this._initializeModelsList();
        return this.listener.getModels();
    }
    ///// CONSUME MODELS
    consumeDiscoverModelFromGraph() {
        this._initializeModelsList();
        return this.discover.consumeModels();
    }
    consumePilotModelFromGraph() {
        this._initializeModelsList();
        return this.pilot.consumeModels();
    }
    consumeListenerModelFromGraph() {
        this._initializeModelsList();
        return this.listener.consumeModels();
    }
}
exports.SpinalOrganSNMP = SpinalOrganSNMP;
SpinalOrganSNMP.TYPE = constants_1.SNMP_ORGAN_TYPE;
SpinalOrganSNMP.CONTEXT_TO_ORGAN_RELATION = "hasBmsNetworkOrgan";
;
spinal_core_connectorjs_1.spinalCore.register_models([SpinalOrganSNMP]);
exports.default = SpinalOrganSNMP;
//# sourceMappingURL=SpinalOrganSNMP.js.map