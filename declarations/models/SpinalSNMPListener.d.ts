import { Model } from "spinal-core-connectorjs";
import { SpinalNode, SpinalGraph, SpinalContext } from "spinal-model-graph";
import { IDataNodes } from "./constants";
declare class SpinalSNMPListener extends Model {
    constructor(graph?: SpinalGraph, context?: SpinalContext, organ?: SpinalNode, network?: SpinalNode, bmsDevice?: SpinalNode, profile?: SpinalNode, saveTimeSeries?: boolean);
    getAllData(): Promise<IDataNodes>;
    getGraph(): Promise<SpinalNode>;
    getOrgan(): Promise<SpinalNode>;
    getContext(): Promise<SpinalContext>;
    getBmsDevice(): Promise<SpinalNode>;
    getNetwork(): Promise<SpinalNode>;
    getProfile(): Promise<SpinalNode>;
    addToGraph(): Promise<number>;
    removeFromGraph(): Promise<boolean>;
    addToDevice(): Promise<void>;
    private _loadData;
}
export { SpinalSNMPListener };
export default SpinalSNMPListener;
