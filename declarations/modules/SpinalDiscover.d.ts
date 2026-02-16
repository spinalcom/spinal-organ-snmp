import { EventEmitter } from "node:events";
import { SpinalSNMPDiscover } from "spinal-model-snmp";
declare class SpinalDiscover extends EventEmitter {
    private static _instance;
    private discoverRequestsQueue;
    private processing;
    private constructor();
    static getInstance(): SpinalDiscover;
    startDiscoverQueueProcessing(): void;
    addToDiscoverQueue(discoverModel: SpinalSNMPDiscover): Promise<number>;
    private _listenQueueStartEvent;
    private _discoverNextInQueue;
    /**
     * Bind discover model to execute appropriate actions on state changes
     * @param discoverModel
     */
    private _bindDiscoverModelState;
    private discoverNetworks;
    private _discoverNetwork;
    private _createNetworkInGraph;
    private _addDeviceToOrgan;
    private _getContextAndOrgan;
    private _getMibDataAsJson;
    private _discoveredIsCancelled;
    private _formatDiscoverResultAsTree;
    private _getOrCreateDeviceNode;
}
export default SpinalDiscover;
export { SpinalDiscover };
