import { EventEmitter } from "node:events";
import { IProfile } from "../types";
import { Process } from "spinal-core-connectorjs";
import { SpinalSNMPListener } from "spinal-model-snmp";
import SpinalDevice from "../modules/SpinalDevice";
import { SpinalNode } from "spinal-env-viewer-graph-service";
declare class SpinalNetworkUtils extends EventEmitter {
    private static _instance;
    profiles: Map<string, IProfile>;
    profileToDevices: Map<string, Set<string>>;
    profileBinded: Map<string, Process>;
    private constructor();
    static getInstance(): SpinalNetworkUtils;
    initModels(models: SpinalSNMPListener[]): Promise<SpinalDevice[]>;
    private initSpinalListenerModel;
    initProfile(profile: SpinalNode, deviceId: string): Promise<IProfile>;
    private _bindProfile;
}
export default SpinalNetworkUtils;
export { SpinalNetworkUtils };
