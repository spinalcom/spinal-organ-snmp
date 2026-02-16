import { SpinalOrganSNMP, SpinalSNMPDiscover, SpinalSNMPListener, SpinalSNMPPilot } from "spinal-model-snmp";
export declare function CreateOrganConfigFile(spinalConnection: spinal.FileSystem, path: string, connectorName: string): Promise<SpinalOrganSNMP>;
export declare function GetPm2Instance(organName: string): Promise<unknown>;
export declare const WaitModelReady: () => Promise<any>;
export declare const connectionErrorCallback: (err?: Error) => void;
export declare const SpinalDiscoverCallback: (spinalDisoverModel: SpinalSNMPDiscover, organModel: SpinalOrganSNMP) => Promise<void | boolean>;
export declare const SpinalListnerCallback: (spinalListenerModel: SpinalSNMPListener, organModel: SpinalOrganSNMP) => Promise<void>;
export declare const SpinalPilotCallback: (spinalPilotModel: SpinalSNMPPilot, organModel: SpinalOrganSNMP) => Promise<void>;
/**
 * Binds the organ models (discover, pilot, listener) to their respective callbacks
 * @param organModel
 */
export declare function bindModels(organModel: SpinalOrganSNMP): Promise<void>;
/**
 * Waits for the specified number of milliseconds.
 * @param ms Number of milliseconds to wait.
 * @returns Promise that resolves after the given time.
 */
export declare function wait(ms: number): Promise<void>;
