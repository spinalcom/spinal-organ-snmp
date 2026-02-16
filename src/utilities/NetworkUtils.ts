import { EventEmitter } from "node:events";
import { IProfile } from "../types";
import { Process } from "spinal-core-connectorjs";
import { SpinalSNMPListener } from "spinal-model-snmp";
import SpinalDevice from "../modules/SpinalDevice";
import { SpinalNode } from "spinal-env-viewer-graph-service";
import snmpProfileService from "./profile_service";



class SpinalNetworkUtils extends EventEmitter {
    private static _instance: SpinalNetworkUtils;

    profiles: Map<string, IProfile> = new Map();
    profileToDevices: Map<string, Set<string>> = new Map();
    profileBinded: Map<string, Process> = new Map();

    private constructor() {
        super();
    }

    public static getInstance(): SpinalNetworkUtils {
        if (!this._instance) this._instance = new SpinalNetworkUtils();
        return this._instance;
    }

    public initModels(models: SpinalSNMPListener[]): Promise<SpinalDevice[]> {
        const promises = models.map((model) => this.initSpinalListenerModel(model));
        return Promise.all(promises).then((result) => {
            return result.filter((device) => typeof device !== "undefined") as SpinalDevice[];
        })
    }


    private async initSpinalListenerModel(spinalListenerModel: SpinalSNMPListener): Promise<SpinalDevice | void> {

        const { graph, organ, context, device, network, profile } = await spinalListenerModel.getAllData();

        const profileData = await this.initProfile(profile, device.getId().get());

        const spinalDevice = new SpinalDevice(context, organ, network, device, spinalListenerModel, profileData);

        return spinalDevice.init().then(() => {
            console.log(`device "${device.getName().get()}" initialized`);
            this._bindProfile(profile);
            return spinalDevice;
        }).catch((err) => {
            console.error(`error initializing device "${device.getName().get()}" du to:`, err.message);
        });

    }


    public async initProfile(profile: SpinalNode, deviceId: string): Promise<IProfile> {
        const profileId = profile.getId().get();

        let profileFound = this.profiles.get(profileId);

        if (!profileFound || profileFound.modificationDate !== profile.info.indirectModificationDate.get()) {
            const intervals = await snmpProfileService.getInstance().getIntervals(profile);
            profileFound = { modificationDate: profile.info.indirectModificationDate.get(), node: profile, intervals }

            this.profiles.set(profileId, profileFound);
        }

        const ids = this.profileToDevices.get(profileId) || new Set();
        ids.add(deviceId);

        this.profileToDevices.set(profileId, ids);

        return profileFound;
    }


    private _bindProfile(profile: SpinalNode) {
        const profileId = profile.getId().get();
        if (this.profileBinded.has(profileId)) return;

        const bindProcess = profile.info.indirectModificationDate.bind(() => {
            const devicesIds = this.profileToDevices.get(profileId);
            console.log(`profile changed`)
            this.emit("profileUpdated", { profileId: profileId, devicesIds: Array.from(devicesIds!) });
        }, false);

        this.profileBinded.set(profileId, bindProcess);
    }



}

export default SpinalNetworkUtils;
export { SpinalNetworkUtils }