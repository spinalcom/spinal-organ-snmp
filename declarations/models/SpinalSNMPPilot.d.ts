import { Model } from "spinal-core-connectorjs";
import { SpinalNode } from "spinal-model-graph";
import { IRequest } from "./constants";
declare class SpinalSNMPPilot extends Model {
    constructor(organ?: SpinalNode, request?: IRequest);
    setInitMode(): void;
    setProcessMode(): void;
    setSuccessMode(): void;
    setErrorMode(): void;
    getOrgan(): Promise<SpinalNode>;
    addToGraph(): Promise<number>;
    removeFromGraph(): Promise<boolean>;
    addToNode(endpoint: SpinalNode<any>): Promise<any>;
    removeFromNode(): Promise<any>;
}
export { SpinalSNMPPilot };
export default SpinalSNMPPilot;
