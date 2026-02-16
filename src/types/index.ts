import { SpinalContext, SpinalNode } from "spinal-env-viewer-graph-service";
import { SnmpError } from "../utilities/SnmpUtils";
import SpinalDevice from "../modules/SpinalDevice";
import { SpinalSNMPListener } from "spinal-model-snmp";

export type Community = "public" | "private";
export type OidDescription = { oid: string, description: string };

export type MibType = { [key: string]: string };


export interface IRequest {
    address: string;
    oid: string;
    value: string | number;
    type: number;
}

export interface IDiscoverResult {
    target: string;
    reachable: boolean;
    oids?: IOidsItem[];
    error?: SnmpError;
}

export interface IOidsItem {
    oid: string;
    type: number;
    value: number;
    name: string;
    saveTimeSeries?: boolean;
}

export type IOidTreeNode = IOidsItem & { children?: IOidTreeNode[], address?: string };

export function isSuccessfulDiscover(result: IDiscoverResult): boolean {
    return result.reachable && !!result.oids;
}

export type NodeToUpdate = { name: string, id: string, idNetwork: string, saveTimeSeries: boolean };

export interface ISpinalInterval {
    node: { value: number, name: string, id: string };
    nodeToUpdate: NodeToUpdate[]
}

// export type ISpinalIntervalValue = { [key: string]: ISpinalInterval };

export interface IProfile {
    modificationDate: number;
    node: SpinalNode;
    intervals: ISpinalInterval[];
}

export interface IDeviceInfo {
    context: SpinalContext;
    spinalDevice: SpinalDevice;
    profile: IProfile;
    spinalModel: SpinalSNMPListener;
    network: SpinalNode;
}

