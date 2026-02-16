import * as snmp from 'net-snmp';
import { Community, OidDescription, MibType, IDiscoverResult, IOidsItem, IRequest, IOidTreeNode } from '../types';
import { classicOIDs } from './classic_oid';

class SnmpError extends Error {
    constructor(error: Error | string, public code?: string) {
        const message = typeof error === 'string' ? error : error.message;
        super(message);
        this.name = 'SnmpError';
    }
}

export default class SnmpUtils {
    private static _instance: SnmpUtils;
    private static readonly DEFAULT_TIMEOUT = 5000;
    private static readonly DEFAULT_RETRIES = 1;
    private static readonly DEFAULT_SNMP_PORT = 161;
    private static readonly DEFAULT_MAX_REPETITIONS = 50;

    private constructor() { }

    public static getInstance(): SnmpUtils {
        if (!this._instance) {
            this._instance = new SnmpUtils();
        }

        return this._instance;
    }

    // public async getTree(target: string, community: Community = "public", mibData: MibType = {}) { }


    /**
     * Discovers SNMP device information including system OIDs and interfaces
     * @param target - IP address with optional port (e.g., "192.168.1.1" or "192.168.1.1:161")
     * @param community - SNMP community string (default: "public")
     * @returns Promise with device information or error details
     */
    public async discover(target: string, community: Community = "public", mibData: MibType = {}): Promise<IDiscoverResult> {

        const session = this._createSession(target, community);

        try {
            const sysOids = Array.from(Object.keys(mibData)); // Get OIDs from mibData
            const oidsObject = await this.getOidsValues(target, sysOids, session, mibData);

            const interfaceOids = await this._getInterfaceOids(session, mibData);

            return {
                oids: [...interfaceOids, ...oidsObject],
                target,
                reachable: true,
                // interfaces: interfaceOids
            }

        } catch (error) {
            return { reachable: false, target, error: new SnmpError(error as Error) };
        } finally {
            this._closeSession(session);
        }
    }


    /**
     * Gets values for specified OIDs using either an existing session or by creating a new one
     * @param oids - OID or array of OIDs to retrieve
     * @param target - Target IP address (required if session not provided)
     * @param session - Optional existing SNMP session
     * @returns Promise with OID values as key-value pairs
     */
    public getOidsValues(target: string, oids: string | string[], session?: snmp.Session, mibData: MibType = {}): Promise<snmp.Varbind[]> {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(oids)) oids = [oids];
            if (!session) session = this._createSession(target);

            let tempOids = [...oids, ...oids.map(o => `${o}.0`)]; // Append .0 for scalar OIDs
            tempOids = Array.from(new Set(tempOids)); // Remove duplicates

            session.get(Array.from(tempOids), (error, varbinds) => {
                if (error) {
                    this._closeSession(session);
                    reject(new SnmpError(error));
                } else {
                    this._closeSession(session);

                    // Format varbinds with MIB names if available

                    const formatted = varbinds.reduce((items, vb) => {
                        if (snmp.isVarbindError(vb)) return items;
                        vb.name = mibData[vb.oid] || mibData[vb.oid.replace(/\.0$/, "")] || vb.oid;
                        vb.value = this._convertVarbindToString(vb);
                        items.push(vb);
                        return items;
                    }, []);

                    resolve(formatted);
                }
            });
        });
    }


    /**
     * Gets values for specified OIDs using either an existing session or by creating a new one
     * @param target - Target IP address (required)
     * @param oids - OID or array of OIDs to retrieve
     * @returns Promise with OID values as key-value pairs
     */
    public async getOidsValuesAsObject(target: string, oids: string | string[]): Promise<{ [oid: string]: any }> {

        try {
            const varbinds = await this.getOidsValues(target!, oids);
            return this._convertOIdsToObject(varbinds);
        } catch (error) {
            throw new SnmpError(error as Error);
        }
    }


    // public async getTable(tableEntryOid: string, target: string, comunity: Community = "public"): Promise<IOidsItem[]> {

    //     let session = this._createSession(target, comunity);

    //     try {
    //         const varbinds = await this.subtree(session, tableEntryOid);

    //         // rows[index] = { [column]: value }
    //         const rows = new Map<number, Record<string, any>>();

    //         for (const vb of varbinds) {
    //             if (snmp.isVarbindError(vb)) continue;


    //             const parts = vb.oid.split(".").filter(Boolean).map(Number);
    //             const index = parts[parts.length - 1];
    //             const column = parts[parts.length - 2];


    //             if (!rows.has(index)) rows.set(index, { index });
    //             rows.get(index)![String(column)] = this._convertVarbindToString(vb);
    //         }


    //         return Array.from(rows.values()).sort((a, b) => a.index - b.index);
    //     } finally {
    //         this._closeSession(session);
    //     }
    // }


    public setOidValue(target: string, varbinds: IRequest | IRequest[]): Promise<snmp.Varbind[]> {
        if (!Array.isArray(varbinds)) varbinds = [varbinds];

        return new Promise(async (resolve, reject) => {
            const session = this._createSession(target);
            try {
                session.set(varbinds, (error, varbindsData) => {
                    if (error) {
                        this._closeSession(session);
                        return reject(new SnmpError(error));
                    }

                    return resolve(varbindsData);
                });

            } catch (error) {
                this._closeSession(session);
                return reject(new SnmpError(error as Error));
            }

        });
    }


    public convertOidsToTree(oids: IOidsItem[]): IOidTreeNode[] {
        return oids.map(oid => ({
            ...oid,
            children: []
        }));
    }

    /**
    * Alternative table method: for small tables, you can walk() instead of subtree().
    */
    // public async getTableViaWalk(tableEntryOid: string, target: string, community: Community = "public", maxRepetitions: number = SnmpUtils.DEFAULT_MAX_REPETITIONS): Promise<IOidsItem[]> {

    //     let session = this._createSession(target, community);

    //     try {
    //         const varbinds = await this.walkBaseOid(session, tableEntryOid, maxRepetitions);
    //         const rows = new Map<number, Record<string, any>>();


    //         for (const vb of varbinds) {
    //             if (snmp.isVarbindError(vb)) continue; // skip errors

    //             const parts = vb.oid.split(".").filter(Boolean).map(Number);

    //             const index = parts[parts.length - 1];
    //             const column = parts[parts.length - 2];

    //             if (!rows.has(index)) rows.set(index, { index });

    //             rows.get(index)![String(column)] = this._convertVarbindToString(vb);
    //         }


    //         return Array.from(rows.values()).sort((a, b) => a.index - b.index);
    //     } finally {
    //         if (session) session.close();
    //     }
    // }

    public createReceiver(options: snmp.Options, callback: (error: Error, notification: any) => void): snmp.Receiver {
        return snmp.createReceiver(options, callback);
    }

    /////////////////////////////////////////////

    /**
    * subtree() is usually easier than implementing GETNEXT loops.
    */
    private subtree(session: snmp.Session, baseOid: string): Promise<snmp.Varbind[]> {
        return new Promise((resolve, reject) => {
            const out: snmp.Varbind[] = [];
            session.subtree(baseOid, (vb) => out.push(vb),
                (err) => (err ? reject(new SnmpError(err)) : resolve(out))
            );
        });
    }

    private async _getInterfaceOids(session: snmp.Session, mibData: MibType = {}): Promise<OidDescription[]> {
        let interfaces: OidDescription[] = [];
        try {
            const interfaceDescr = await this.walkBaseOid(session, `${classicOIDs.interfaces}.1.2`);
            interfaces = interfaceDescr.reduce((acc, varbind) => {
                if (!snmp.isVarbindError(varbind)) {
                    const name = mibData[varbind.oid] || mibData[varbind.oid.replace(/\.0$/, "")] || varbind.oid;
                    varbind.name = name;
                    acc.push(varbind);
                }

                return acc;
            }, []);
        } catch (error) { }

        return interfaces;
    }

    private async walkBaseOid(session: snmp.Session, baseOid: string, maxRepetitions: number = SnmpUtils.DEFAULT_MAX_REPETITIONS): Promise<snmp.Varbind[]> {
        return new Promise<snmp.Varbind[]>((resolve, reject) => {
            const out: IOidsItem[] = [];
            session.walk(baseOid, maxRepetitions,
                (varbinds: IOidsItem[]) => out.push(...varbinds),
                (err) => err ? reject(new SnmpError(err)) : resolve(out)
            );
        });
    }


    private _createSession(target: string, community: Community = "public"): snmp.Session {
        const [ip, portStr] = target.split(":");
        const port = portStr ? parseInt(portStr) : SnmpUtils.DEFAULT_SNMP_PORT;

        return snmp.createSession(ip, community, {
            version: snmp.Version2c,
            timeout: SnmpUtils.DEFAULT_TIMEOUT,
            retries: SnmpUtils.DEFAULT_RETRIES,
            port
        });
    }

    private _convertVarbindToString(varbind: snmp.Varbind): string {
        if (varbind.value === null || varbind.value === undefined) return varbind.value;

        if (snmp.isVarbindError(varbind)) return snmp.varbindError(varbind).toString();

        return Buffer.isBuffer(varbind.value) ? varbind?.value?.toString("utf8") : varbind.value;
    }

    private _convertOIdsToObject(varbinds: snmp.Varbind[]): { [oid: string]: string } {
        return varbinds.reduce((acc, varbind) => {
            if (!snmp.isVarbindError(varbind)) {
                acc[varbind.oid] = this._convertVarbindToString(varbind);
            }
            return acc;
        }, {} as { [oid: string]: string });
    }

    private _closeSession(session: snmp.Session): void {
        try {
            session?.close();
        } catch (error) {
            // console.log(`failed to close session due to`, error.message);

        }
    }

    public static _formatTypeValue(type: number): string | void {
        // type = snmp.ObjectType[type] || type;
        type = Number(type);

        switch (type) {
            case snmp.ObjectType.Integer:
                return snmp.ObjectType.Integer;
            case snmp.ObjectType.OctetString:
                return snmp.ObjectType.OctetString;
            case snmp.ObjectType.Counter64:
                return snmp.ObjectType.Counter64;
            default:
                return snmp.ObjectType[type];
        }
    }

    public static _formatValue(value: any, type: number): number | string | boolean {
        if (type == snmp.ObjectType.Integer) return parseInt(value);
        if (type == snmp.ObjectType.Boolean) return Boolean(value);

        return value;
    }

    // For set operations, OIDs should not end with .0 even if they are scalar
    public static _formatOid(oid: string): string {
        if (oid.endsWith(".0")) return oid.replace(/\.0$/, "");
        return oid;
    }


}

export { SnmpUtils, SnmpError };