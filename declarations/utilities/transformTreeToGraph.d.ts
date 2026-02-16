import { SpinalContext, SpinalNode } from "spinal-model-graph";
import { IOidTreeNode } from "../types";
export declare function addAllEndpointsToDevice(context: SpinalContext, nodes: IOidTreeNode[], parentNode: SpinalNode, nodesAlreadyCreated: {
    [key: string]: SpinalNode;
}): Promise<SpinalNode[]>;
export declare function createAndAddEndpointsToDevice(context: SpinalContext, nodeInfo: IOidTreeNode, deviceNode: SpinalNode): Promise<SpinalNode>;
export declare function _getNodeAlreadyInGraph(context: SpinalContext, deviceNode: SpinalNode): Promise<{
    [key: string]: SpinalNode;
}>;
