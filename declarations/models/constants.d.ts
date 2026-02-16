import { SpinalNode } from 'spinal-model-graph';
export declare const SNMP_ORGAN_TYPE = "SNMP_ORGAN_TYPE";
export declare enum STATES {
    error = -1,
    reseted = 0,
    discovering = 1,
    discovered = 2,
    timeout = 3,
    creating = 4,
    created = 5
}
export interface IDataNodes {
    graph: SpinalNode;
    organ: SpinalNode;
    context: SpinalNode;
    device: SpinalNode;
    network: SpinalNode;
    profile: SpinalNode;
}
export interface IRequest {
    value: string | number | boolean;
    nodeId: string;
}
