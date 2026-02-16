"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalNetworkUtils = void 0;
const node_events_1 = require("node:events");
const SpinalDevice_1 = require("../modules/SpinalDevice");
const profile_service_1 = require("./profile_service");
class SpinalNetworkUtils extends node_events_1.EventEmitter {
    constructor() {
        super();
        this.profiles = new Map();
        this.profileToDevices = new Map();
        this.profileBinded = new Map();
    }
    static getInstance() {
        if (!this._instance)
            this._instance = new SpinalNetworkUtils();
        return this._instance;
    }
    initModels(models) {
        const promises = models.map((model) => this.initSpinalListenerModel(model));
        return Promise.all(promises).then((result) => {
            return result.filter((device) => typeof device !== "undefined");
        });
    }
    async initSpinalListenerModel(spinalListenerModel) {
        const { graph, organ, context, device, network, profile } = await spinalListenerModel.getAllData();
        const profileData = await this.initProfile(profile, device.getId().get());
        const spinalDevice = new SpinalDevice_1.default(context, organ, network, device, spinalListenerModel, profileData);
        return spinalDevice.init().then(() => {
            console.log(`device "${device.getName().get()}" initialized`);
            this._bindProfile(profile);
            return spinalDevice;
        }).catch((err) => {
            console.error(`error initializing device "${device.getName().get()}" du to:`, err.message);
        });
    }
    async initProfile(profile, deviceId) {
        const profileId = profile.getId().get();
        let profileFound = this.profiles.get(profileId);
        if (!profileFound || profileFound.modificationDate !== profile.info.indirectModificationDate.get()) {
            const intervals = await profile_service_1.default.getInstance().getIntervals(profile);
            profileFound = { modificationDate: profile.info.indirectModificationDate.get(), node: profile, intervals };
            this.profiles.set(profileId, profileFound);
        }
        const ids = this.profileToDevices.get(profileId) || new Set();
        ids.add(deviceId);
        this.profileToDevices.set(profileId, ids);
        return profileFound;
    }
    _bindProfile(profile) {
        const profileId = profile.getId().get();
        if (this.profileBinded.has(profileId))
            return;
        const bindProcess = profile.info.indirectModificationDate.bind(() => {
            const devicesIds = this.profileToDevices.get(profileId);
            console.log(`profile changed`);
            this.emit("profileUpdated", { profileId: profileId, devicesIds: Array.from(devicesIds) });
        }, false);
        this.profileBinded.set(profileId, bindProcess);
    }
}
exports.SpinalNetworkUtils = SpinalNetworkUtils;
exports.default = SpinalNetworkUtils;
//# sourceMappingURL=NetworkUtils.js.map