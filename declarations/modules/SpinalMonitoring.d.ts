import { SpinalSNMPListener } from "spinal-model-snmp";
declare class SpinalMonitoring {
    private static instance;
    private _monitoringQueue;
    private _priorityQueue;
    private _monitoringIsRunning;
    private _intervalTimesMap;
    private _spinalDeviceMap;
    private constructor();
    static getInstance(): SpinalMonitoring;
    addToMonitoringQueue(model: SpinalSNMPListener): void;
    private _startDevicesInitialization;
    private _startMonitoring;
    private _executeUpdate;
    private _bindDevices;
    private _startDeviceMonitoring;
    private _stopDeviceMonitoring;
    private _addToSpinalDeviceMap;
    private _removeDeviceFromIntervalTimesMap;
    private _addDeviceToIntervalTimesMap;
    private _addIntervalToPriorityQueue;
    private _monitorWithCov;
    private _handleProfileUpdate;
}
export default SpinalMonitoring;
export { SpinalMonitoring };
