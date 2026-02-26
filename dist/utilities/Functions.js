"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionErrorCallback = exports.WaitModelReady = exports.SpinalPilotCallback = exports.SpinalListnerCallback = exports.SpinalDiscoverCallback = void 0;
exports.bindModels = bindModels;
exports.wait = wait;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const Q = require("q");
const spinal_model_snmp_1 = require("spinal-model-snmp");
const spinal_model_graph_1 = require("spinal-model-graph");
const SpinalDiscover_1 = require("../modules/SpinalDiscover");
const SpinalPilot_1 = require("../modules/SpinalPilot");
const SpinalMonitoring_1 = require("../modules/SpinalMonitoring");
/**
 * Binds the organ models (discover, pilot, listener) to their respective callbacks
 * @param organModel
 */
async function bindModels(organModel) {
    const { discover, listener, pilot } = await organModel.getModels();
    const listenerAlreadyBinded = new Set();
    const discoverAlreadyBinded = new Set();
    //////////////// 
    //bind discover model[discover]
    ////////////////
    discover.modification_date.bind(async () => {
        const discoverList = await organModel.getDiscoverModelFromGraph();
        for (const spinalDiscoverModel of discoverList) {
            if (discoverAlreadyBinded.has(spinalDiscoverModel._server_id))
                continue;
            (0, exports.SpinalDiscoverCallback)(spinalDiscoverModel, organModel);
            discoverAlreadyBinded.add(spinalDiscoverModel._server_id);
        }
    });
    ///////////////
    //  bind pilot model [write value to bacnet device]
    ///////////////
    pilot.modification_date.bind(async () => {
        const pilotList = await organModel.getPilotModelFromGraph();
        for (const spinalPilotModel of pilotList) {
            (0, exports.SpinalPilotCallback)(spinalPilotModel, organModel);
        }
    }, true);
    ////////////
    //  bind listener model [monitoring bacnet device]
    ////////////
    listener.modification_date.bind(async () => {
        const listenerList = await organModel.getListenerModelFromGraph();
        for (let i = 0; i < listenerList.length; i++) {
            const spinalListenerModel = listenerList[i];
            if (listenerAlreadyBinded.has(spinalListenerModel._server_id))
                continue;
            (0, exports.SpinalListnerCallback)(spinalListenerModel, organModel);
            listenerAlreadyBinded.add(spinalListenerModel._server_id);
        }
    }, true);
}
/**
 * Waits for the specified number of milliseconds.
 * @param ms Number of milliseconds to wait.
 * @returns Promise that resolves after the given time.
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
////////////////////////////////////////////////
////                 CALLBACKS                //
////////////////////////////////////////////////
const SpinalDiscoverCallback = async (spinalDisoverModel, organModel) => {
    await (0, exports.WaitModelReady)();
    const organMatched = await checkIfItsSameOrgan(organModel, spinalDisoverModel);
    if (!organMatched)
        return;
    //////  
    // Timeout after 2 minutes, and remove discover from graph
    //  ///////
    const minute = 2 * (60 * 1000);
    const time = Date.now();
    const creation = spinalDisoverModel.creation?.get() || 0;
    if ((time - creation) >= minute || spinalDisoverModel.state.get() === spinal_model_snmp_1.STATES.created) {
        spinalDisoverModel.changeState(spinal_model_snmp_1.STATES.timeout);
        return spinalDisoverModel.removeFromGraph();
    }
    //////////////////////////////////////////
    SpinalDiscover_1.default.getInstance().addToDiscoverQueue(spinalDisoverModel);
};
exports.SpinalDiscoverCallback = SpinalDiscoverCallback;
const SpinalListnerCallback = async (spinalListenerModel, organModel) => {
    await (0, exports.WaitModelReady)();
    const organMatched = await checkIfItsSameOrgan(organModel, spinalListenerModel);
    if (organMatched) {
        SpinalMonitoring_1.default.getInstance().addToMonitoringQueue(spinalListenerModel);
    }
};
exports.SpinalListnerCallback = SpinalListnerCallback;
const SpinalPilotCallback = async (spinalPilotModel, organModel) => {
    await (0, exports.WaitModelReady)();
    const organMatched = await checkIfItsSameOrgan(organModel, spinalPilotModel);
    if (!organMatched)
        return;
    //////  
    // Timeout after 2 minutes, and remove pilote request from graph
    //  ///////
    const minute = 2 * (60 * 1000);
    const time = Date.now();
    const creation = spinalPilotModel.creation?.get() || 0;
    const state = spinalPilotModel.state.get();
    if ((time - creation) >= minute || ["success", "error"].includes(state)) {
        spinalPilotModel.setErrorMode();
        return spinalPilotModel.removeFromGraph();
    }
    /////////////////////////////////////////
    const spinalPilot = new SpinalPilot_1.default(spinalPilotModel);
    await spinalPilot.sendPilotRequest();
};
exports.SpinalPilotCallback = SpinalPilotCallback;
async function checkIfItsSameOrgan(organ, modelReceived) {
    let organNode = await modelReceived?.getOrgan();
    if (organNode instanceof spinal_model_graph_1.SpinalNode) {
        organNode = await organNode.getElement(true);
    }
    return organ?._server_id === organNode?._server_id && organNode;
}
const WaitModelReady = () => {
    const deferred = Q.defer();
    const WaitModelReadyLoop = (defer) => {
        if (spinal_core_connectorjs_type_1.FileSystem._sig_server === false) {
            setTimeout(() => {
                defer.resolve(WaitModelReadyLoop(defer));
            }, 200);
        }
        else {
            defer.resolve();
        }
        return defer.promise;
    };
    return WaitModelReadyLoop(deferred);
};
exports.WaitModelReady = WaitModelReady;
const connectionErrorCallback = (err) => {
    if (!err)
        console.error('Error Connect');
    else
        console.error('Error Connect', err);
    process.exit(0);
};
exports.connectionErrorCallback = connectionErrorCallback;
//# sourceMappingURL=Functions.js.map