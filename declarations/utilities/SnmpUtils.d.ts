import * as snmp from 'net-snmp';
import { Community, MibType, IDiscoverResult, IOidsItem, IRequest, IOidTreeNode } from '../types';
declare class SnmpError extends Error {
    code?: string;
    constructor(error: Error | string, code?: string);
}
export default class SnmpUtils {
    private static _instance;
    private static readonly DEFAULT_TIMEOUT;
    private static readonly DEFAULT_RETRIES;
    private static readonly DEFAULT_SNMP_PORT;
    private static readonly DEFAULT_MAX_REPETITIONS;
    private constructor();
    static getInstance(): SnmpUtils;
    /**
     * Discovers SNMP device information including system OIDs and interfaces
     * @param target - IP address with optional port (e.g., "192.168.1.1" or "192.168.1.1:161")
     * @param community - SNMP community string (default: "public")
     * @returns Promise with device information or error details
     */
    discover(target: string, community?: Community, mibData?: MibType): Promise<IDiscoverResult>;
    /**
     * Gets values for specified OIDs using either an existing session or by creating a new one
     * @param oids - OID or array of OIDs to retrieve
     * @param target - Target IP address (required if session not provided)
     * @param session - Optional existing SNMP session
     * @returns Promise with OID values as key-value pairs
     */
    getOidsValues(target: string, oids: string | string[], session?: snmp.Session, mibData?: MibType): Promise<snmp.Varbind[]>;
    /**
     * Gets values for specified OIDs using either an existing session or by creating a new one
     * @param target - Target IP address (required)
     * @param oids - OID or array of OIDs to retrieve
     * @returns Promise with OID values as key-value pairs
     */
    getOidsValuesAsObject(target: string, oids: string | string[]): Promise<{
        [oid: string]: any;
    }>;
    setOidValue(target: string, varbinds: IRequest | IRequest[]): Promise<snmp.Varbind[]>;
    convertOidsToTree(oids: IOidsItem[]): IOidTreeNode[];
    /**
    * Alternative table method: for small tables, you can walk() instead of subtree().
    */
    createReceiver(options: snmp.Options, callback: (error: Error, notification: any) => void): snmp.Receiver;
    /**
    * subtree() is usually easier than implementing GETNEXT loops.
    */
    private subtree;
    private _getInterfaceOids;
    private walkBaseOid;
    private _createSession;
    private _convertVarbindToString;
    private _convertOIdsToObject;
    private _closeSession;
    static _formatTypeValue(type: number): string | void;
    static _formatValue(value: any, type: number): number | string | boolean;
    static _formatOid(oid: string): string;
}
export { SnmpUtils, SnmpError };
