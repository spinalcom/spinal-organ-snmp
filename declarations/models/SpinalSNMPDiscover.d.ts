import { Model } from "spinal-core-connectorjs";
import { SpinalContext, SpinalGraph, SpinalNode } from "spinal-model-graph";
declare class SpinalSNMPDiscover extends Model {
    constructor(graph?: SpinalGraph, context?: SpinalContext, network?: SpinalNode, organ?: SpinalNode);
    setDiscoveringMode(): void;
    setDiscoveredMode(): void;
    setResetedMode(): void;
    setTimeoutMode(): void;
    setCreatingMode(): void;
    setCreatedMode(): void;
    setErrorMode(): void;
    getOrgan(): Promise<SpinalNode>;
    addToGraph(): Promise<number>;
    remove(): Promise<boolean>;
}
export { SpinalSNMPDiscover };
export default SpinalSNMPDiscover;
