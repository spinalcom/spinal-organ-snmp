import { SpinalNode } from "spinal-env-viewer-graph-service";
import { ISpinalInterval } from "../types";
export declare const CONTEXT_NAME = "SNMPdeviceProfileContext";
export declare const ITEMS_GROUP_NAME = "Item_list";
export declare const SUPERVISION_NAME = "Supervision";
export declare const CONTEXT_TYPE = "SNMP Profile";
export declare const PROFILE_TYPE = "SNMPDeviceProfile";
export declare const ITEM_LIST_TYPE = "itemList";
export declare const ITEM_TYPE = "item";
export declare const SUPERVISION_TYPE = "Supervision";
export declare const INTERVAL_TYPE = "Interval";
export declare const CONTEXT_TO_PROFILE_RELATION = "hasProfile";
export declare const PROFILE_TO_ITEMS_GROUP = "hasItems";
export declare const PROFILE_TO_SUPERVISION = "hasSupervision";
export declare const SUPERVISION_TO_INTERVAL = "hasIntervalTime";
export declare const ITEM_LIST_TO_ITEM = "hasItem";
export declare const INTERVAL_TO_ITEM = "hasItem";
export default class SnmpProfileService {
    private static instance;
    private constructor();
    static getInstance(): SnmpProfileService;
    getItems(profile: any): Promise<any>;
    getItemListNode(profile: any): Promise<any>;
    getIntervals(profile: any): Promise<ISpinalInterval[]>;
    getSupervisionNode(profile: any): Promise<SpinalNode>;
}
export { SnmpProfileService };
