import { Lst, Model } from "spinal-core-connectorjs";
export default class ModelsInfo<T extends Model> extends Model {
    constructor();
    addModel(model: T): Promise<number>;
    getModels(): Promise<Lst<T>>;
    consumeModels(): Promise<T[]>;
    removeModel(model: T): Promise<boolean>;
}
export { ModelsInfo };
