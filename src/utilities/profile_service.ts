import { SpinalGraphService, SpinalNode, SPINAL_RELATION_PTR_LST_TYPE, SpinalContext } from "spinal-env-viewer-graph-service";
import { SpinalBmsDevice } from "spinal-model-bmsnetwork";
import { ISpinalInterval } from "../types";

export const CONTEXT_NAME = "SNMPdeviceProfileContext";
export const ITEMS_GROUP_NAME = "Item_list";
export const SUPERVISION_NAME = "Supervision";

// TYPES
export const CONTEXT_TYPE = "SNMP Profile";
export const PROFILE_TYPE = "SNMPDeviceProfile";
export const ITEM_LIST_TYPE = "itemList";
export const ITEM_TYPE = "item";
export const SUPERVISION_TYPE = "Supervision";
export const INTERVAL_TYPE = "Interval";

// RELATIONS
export const CONTEXT_TO_PROFILE_RELATION = "hasProfile";
export const PROFILE_TO_ITEMS_GROUP = "hasItems";
export const PROFILE_TO_SUPERVISION = "hasSupervision";
export const SUPERVISION_TO_INTERVAL = "hasIntervalTime";
export const ITEM_LIST_TO_ITEM = "hasItem";
export const INTERVAL_TO_ITEM = "hasItem";


export default class SnmpProfileService {
    private static instance: SnmpProfileService;

    private constructor() { }

    static getInstance(): SnmpProfileService {
        if (!this.instance) {
            this.instance = new SnmpProfileService();
        }
        return this.instance;
    }

    public async getItems(profile) {
        const itemListNode = await this.getItemListNode(profile);
        if (itemListNode) return itemListNode.getChildren(ITEM_LIST_TO_ITEM);

        return [];
    }

    async getItemListNode(profile) {
        const children = await profile.getChildren([PROFILE_TO_ITEMS_GROUP]);
        return children.find(el => el.getName().get() === ITEMS_GROUP_NAME);
    }

    ////////////////////////// Intervals //////////////////////////

    async getIntervals(profile): Promise<ISpinalInterval[]> {
        const supervisionNode = await this.getSupervisionNode(profile);

        if (supervisionNode) {
            const intervals = await supervisionNode.getChildren(SUPERVISION_TO_INTERVAL);
            const promises = intervals.map(async node => {
                const children = await node.getChildren(INTERVAL_TO_ITEM);
                return {
                    node: node.info.get(),
                    nodeToUpdate: children.map(child => child.info.get())
                }
            })

            return Promise.all(promises);
        }

        return [];
    }

    async getSupervisionNode(profile): Promise<SpinalNode> {
        const children = await profile.getChildren(PROFILE_TO_SUPERVISION);
        return children.find(el => el.getName().get() === SUPERVISION_NAME);
    }

}


export { SnmpProfileService };