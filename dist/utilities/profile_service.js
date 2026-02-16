"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnmpProfileService = exports.INTERVAL_TO_ITEM = exports.ITEM_LIST_TO_ITEM = exports.SUPERVISION_TO_INTERVAL = exports.PROFILE_TO_SUPERVISION = exports.PROFILE_TO_ITEMS_GROUP = exports.CONTEXT_TO_PROFILE_RELATION = exports.INTERVAL_TYPE = exports.SUPERVISION_TYPE = exports.ITEM_TYPE = exports.ITEM_LIST_TYPE = exports.PROFILE_TYPE = exports.CONTEXT_TYPE = exports.SUPERVISION_NAME = exports.ITEMS_GROUP_NAME = exports.CONTEXT_NAME = void 0;
exports.CONTEXT_NAME = "SNMPdeviceProfileContext";
exports.ITEMS_GROUP_NAME = "Item_list";
exports.SUPERVISION_NAME = "Supervision";
// TYPES
exports.CONTEXT_TYPE = "SNMP Profile";
exports.PROFILE_TYPE = "SNMPDeviceProfile";
exports.ITEM_LIST_TYPE = "itemList";
exports.ITEM_TYPE = "item";
exports.SUPERVISION_TYPE = "Supervision";
exports.INTERVAL_TYPE = "Interval";
// RELATIONS
exports.CONTEXT_TO_PROFILE_RELATION = "hasProfile";
exports.PROFILE_TO_ITEMS_GROUP = "hasItems";
exports.PROFILE_TO_SUPERVISION = "hasSupervision";
exports.SUPERVISION_TO_INTERVAL = "hasIntervalTime";
exports.ITEM_LIST_TO_ITEM = "hasItem";
exports.INTERVAL_TO_ITEM = "hasItem";
class SnmpProfileService {
    constructor() { }
    static getInstance() {
        if (!this.instance) {
            this.instance = new SnmpProfileService();
        }
        return this.instance;
    }
    async getItems(profile) {
        const itemListNode = await this.getItemListNode(profile);
        if (itemListNode)
            return itemListNode.getChildren(exports.ITEM_LIST_TO_ITEM);
        return [];
    }
    async getItemListNode(profile) {
        const children = await profile.getChildren([exports.PROFILE_TO_ITEMS_GROUP]);
        return children.find(el => el.getName().get() === exports.ITEMS_GROUP_NAME);
    }
    ////////////////////////// Intervals //////////////////////////
    async getIntervals(profile) {
        const supervisionNode = await this.getSupervisionNode(profile);
        if (supervisionNode) {
            const intervals = await supervisionNode.getChildren(exports.SUPERVISION_TO_INTERVAL);
            const promises = intervals.map(async (node) => {
                const children = await node.getChildren(exports.INTERVAL_TO_ITEM);
                return {
                    node: node.info.get(),
                    nodeToUpdate: children.map(child => child.info.get())
                };
            });
            return Promise.all(promises);
        }
        return [];
    }
    async getSupervisionNode(profile) {
        const children = await profile.getChildren(exports.PROFILE_TO_SUPERVISION);
        return children.find(el => el.getName().get() === exports.SUPERVISION_NAME);
    }
}
exports.default = SnmpProfileService;
exports.SnmpProfileService = SnmpProfileService;
//# sourceMappingURL=profile_service.js.map