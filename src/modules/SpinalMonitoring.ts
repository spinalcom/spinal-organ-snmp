import { ISpinalInterval, IProfile, NodeToUpdate } from "../types";
import SpinalNetworkUtils from "../utilities/NetworkUtils";
import { SpinalQueue } from "spinal-connector-service";
import { MinPriorityQueue } from "@datastructures-js/priority-queue";
import { SpinalSNMPListener } from "spinal-model-snmp";
import SpinalDevice from "./SpinalDevice";
import { wait } from "../utilities/Functions";

const spinalNetworkUtils = SpinalNetworkUtils.getInstance();

class SpinalMonitoring {

    private static instance: SpinalMonitoring;
    private _monitoringQueue: SpinalQueue<SpinalSNMPListener> = new SpinalQueue();
    private _priorityQueue: MinPriorityQueue<{ interval: number; nextExecution: number }> = new MinPriorityQueue({ compare: (a, b) => a.nextExecution - b.nextExecution });
    private _monitoringIsRunning: boolean = false;
    private _intervalTimesMap = new Map<number, (ISpinalInterval & { deviceId: string })[]>();
    private _spinalDeviceMap = new Map<string, SpinalDevice>();


    private constructor() {
        this._monitoringQueue.on("start", this._startDevicesInitialization.bind(this));
        spinalNetworkUtils.on("profileUpdated", this._handleProfileUpdate.bind(this));
    }

    public static getInstance(): SpinalMonitoring {
        if (!this.instance) this.instance = new SpinalMonitoring();

        return this.instance;
    }

    public addToMonitoringQueue(model: SpinalSNMPListener) {
        this._monitoringQueue.addToQueue(model);
    }

    private async _startDevicesInitialization() {
        const listenerModels = this._monitoringQueue.toArray();
        this._monitoringQueue.clear();

        console.log(`Starting initialization of ${listenerModels.length} devices.`);
        let spinalDeviceList = await spinalNetworkUtils.initModels(listenerModels);
        console.log(`${spinalDeviceList.length} devices initialized.`);

        // bind devices to detect stop/start monitoring events
        await this._bindDevices(spinalDeviceList);


        if (!this._monitoringIsRunning) {
            this._monitoringIsRunning = true;
            this._startMonitoring();
        }

    }

    private async _startMonitoring() {
        console.log("Monitoring started.");
        const run = true;

        while (run) {
            if (this._priorityQueue.isEmpty()) {
                await wait(1000); // we wait for 500ms before checking again, this is to avoid a tight loop;
                continue;
            }

            const nextInQueue = this._priorityQueue.dequeue();
            if (!nextInQueue) continue; // to satisfy typescript that nextInQueue is not undefined

            const { interval, nextExecution } = nextInQueue;

            if (nextExecution > Date.now()) { // if it's not time to execute the interval
                this._addIntervalToPriorityQueue(interval, nextExecution); // we re-add the interval to the priority queue
                await wait(500); // we wait for 500ms before checking again, this is to avoid a tight loop;
                continue;
            }

            // we execute the interval function
            await this._executeUpdate(interval);
        }
    }

    private async _executeUpdate(interval: number) {
        const intervalDataList = this._intervalTimesMap.get(interval);
        if (!intervalDataList) return;

        const promises: Promise<any>[] = [];

        for (const intervalData of intervalDataList) {
            const { deviceId } = intervalData;
            const spinalDevice = this._spinalDeviceMap.get(deviceId);
            if (!spinalDevice) {
                console.error(`Device with id ${deviceId} not found in spinal device map.`);
                continue;
            }

            promises.push(spinalDevice.updateEndpointsValue(interval));
        }

        await Promise.all(promises);

        this._addIntervalToPriorityQueue(interval);
    }

    private async _bindDevices(spinalDeviceList: SpinalDevice[]) {
        for (const spinalDevice of spinalDeviceList) {
            this._addToSpinalDeviceMap(spinalDevice); // we add the device to the map to easily access it later

            spinalDevice.listenerModel?.monitored.bind(() => {
                const isMonitored = spinalDevice.listenerModel?.monitored.get();

                // if the device is not monitored we stop it and remove it from the interval times map, else we start it
                if (!isMonitored) return this._stopDeviceMonitoring(spinalDevice);

                // if the device is monitored we start it
                this._startDeviceMonitoring(spinalDevice);
            });
        }
    }

    private _startDeviceMonitoring(spinalDevice: SpinalDevice) {
        const { name, id } = spinalDevice.deviceNode.info.get();
        console.log(`Device ${name} is monitored.`);

        const intervalAdded = this._addDeviceToIntervalTimesMap(id, spinalDevice.profileData.intervals);

        for (const interval of intervalAdded) {
            this._addIntervalToPriorityQueue(interval);
        }
    }


    private _stopDeviceMonitoring(spinalDevice: SpinalDevice) {
        const { name, id } = spinalDevice.deviceNode.info.get();

        console.log(`Device ${name} is stopped.`);
        this._removeDeviceFromIntervalTimesMap(id);
    }

    private _addToSpinalDeviceMap(spinalDevice: SpinalDevice) {
        const key = spinalDevice.deviceNode.getId().get();
        this._spinalDeviceMap.set(key, spinalDevice);
    }

    private _removeDeviceFromIntervalTimesMap(deviceId: string) {
        this._intervalTimesMap.forEach((value, key) => {
            value = value.filter(item => item.deviceId !== deviceId);
            this._intervalTimesMap.set(key, value);
        });

        return this._intervalTimesMap;
    }

    private _addDeviceToIntervalTimesMap(deviceId: string, intervals: IProfile["intervals"]): number[] {

        // const intervals = spinalDevice.profileData.intervals;
        // const deviceId = spinalDevice.deviceNode.getId().get();

        const intervalSet = new Set<number>();

        for (const interval of intervals) {
            const intervalValue = interval.node.value;

            // if the interval value is not a number or is less than 0 we skip it
            if (isNaN(intervalValue) || intervalValue < 0) continue;

            // if the interval value is 0 we monitor the device with COV, else we monitor it with the specified interval
            if (intervalValue == 0) {
                this._monitorWithCov(deviceId, interval.nodeToUpdate);
                continue;
            }


            let temp_value = this._intervalTimesMap.get(intervalValue) || [];

            const alreadyExist = temp_value.find(item => item.deviceId === deviceId);

            // if the device is already in the map for this interval we just update the nodeToUpdate array
            if (alreadyExist) alreadyExist.nodeToUpdate.push(...interval.nodeToUpdate);
            //else we add it to the map
            else temp_value.push({ ...interval, deviceId });


            this._intervalTimesMap.set(intervalValue, temp_value);
            intervalSet.add(intervalValue);
        }

        return Array.from(intervalSet);
    }

    private _addIntervalToPriorityQueue(interval: number, nextExecutionTime?: number) {
        const intervalInPriorityQueue = this._priorityQueue.toArray();
        const existingInterval = new Set(intervalInPriorityQueue.map(item => item.interval));

        if (existingInterval.has(interval)) return // if the interval is already in the priority queue we don't add it again

        nextExecutionTime = nextExecutionTime || Number(interval) + Date.now();

        this._priorityQueue.enqueue({ interval, nextExecution: nextExecutionTime });
    }


    private async _monitorWithCov(deviceId: string, nodeToUpdate: NodeToUpdate[]) {
        const spinalDevice = this._spinalDeviceMap.get(deviceId);
        if (!spinalDevice) return;

        await spinalDevice.startMonitoringWithCov(nodeToUpdate);
    }

    private _handleProfileUpdate({ profileId, devicesIds }: { profileId: string, devicesIds: string[] }) {
        for (const deviceId of devicesIds) {
            const spinalDevice = this._spinalDeviceMap.get(deviceId);
            if (!spinalDevice) continue;

            spinalDevice.restartMonitoring();
        }
    }

}


export default SpinalMonitoring;
export { SpinalMonitoring }