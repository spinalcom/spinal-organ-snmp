import { EventEmitter } from "node:events";
import { IProfile, NodeToUpdate } from "../types";
import { SpinalContext, SpinalNode } from "spinal-model-graph";
import { SpinalSNMPListner } from "spinal-model-snmp";
declare class SpinalDevice extends EventEmitter {
    private _info;
    private _context;
    private _organ;
    private _network;
    private _snmpReceiver;
    listenerModel: SpinalSNMPListner;
    deviceNode: SpinalNode;
    profileData: IProfile;
    allEndpoints: {
        [key: string]: SpinalNode;
    };
    constructor(context: SpinalContext, organ: SpinalNode, network: SpinalNode, deviceNode: SpinalNode, listenerModel: SpinalSNMPListner, profileData: IProfile);
    init(): Promise<SpinalNode<any>[]>;
    updateEndpointsValue(interval: number): Promise<void>;
    startMonitoringWithCov(nodesToUpdate: NodeToUpdate[]): Promise<void>;
    _initReceiver(): Promise<void>;
    private _getNodeToUpdate;
    private _updateEndpointInGraph;
    private _setEndpointValue;
    private _saveTimeSeries;
    private _createEndpointNode;
    stopMonitoring(): void;
    startMonitoring(): void;
    restartMonitoring(): void;
}
export default SpinalDevice;
export { SpinalDevice };
