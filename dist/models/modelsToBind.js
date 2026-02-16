"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelsInfo = void 0;
const spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
class ModelsInfo extends spinal_core_connectorjs_1.Model {
    constructor() {
        super();
        this.add_attr({
            modification_date: Date.now(),
            length: 0,
            data: new spinal_core_connectorjs_1.Ptr(new spinal_core_connectorjs_1.Lst())
        });
    }
    async addModel(model) {
        const dataList = await this.getModels();
        dataList.push(model);
        this.length.set(dataList.length);
        this.modification_date.set(Date.now());
        return dataList.length;
    }
    getModels() {
        return new Promise((resolve) => {
            this.data.load((discoverList) => resolve(discoverList));
        });
    }
    consumeModels() {
        return new Promise((resolve) => {
            this.data.load((discoverList) => {
                this.length.set(0);
                const arr = Array.from(discoverList);
                discoverList.clear();
                resolve(arr);
            });
        });
    }
    async removeModel(model) {
        const dataList = await this.getModels();
        const lengthBeforeRemove = dataList.length;
        dataList.remove(model);
        this.length.set(dataList.length);
        return this.length.get() < lengthBeforeRemove;
    }
}
exports.default = ModelsInfo;
exports.ModelsInfo = ModelsInfo;
spinal_core_connectorjs_1.spinalCore.register_models([ModelsInfo]);
//# sourceMappingURL=modelsToBind.js.map