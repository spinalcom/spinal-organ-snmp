import { FileSystem, File as SpinalFile, Model } from "spinal-core-connectorjs_type";
const Q = require("q");
const pm2 = require("pm2");
import { SpinalOrganSNMP, STATES, SpinalSNMPDiscover, SpinalSNMPListener, SpinalSNMPPilot } from "spinal-model-snmp";
import { SpinalNode } from "spinal-model-graph";
import { get } from "node:http";
import SpinalDiscover from "../modules/SpinalDiscover";
import SpinalPilot from "../modules/SpinalPilot";
import SpinalMonitoring from "../modules/SpinalMonitoring";

export function CreateOrganConfigFile(spinalConnection: spinal.FileSystem, path: string, connectorName: string): Promise<SpinalOrganSNMP> {
    return new Promise((resolve) => {
        spinalConnection.load_or_make_dir(`${path}`, async (directory) => {

            const found = await findFileInDirectory(directory, connectorName);

            if (found) {
                console.log("organ found !");
                return resolve(found);
            }

            console.log("organ not found");
            const model = new SpinalOrganSNMP(connectorName); // create a new model instance
            WaitModelReady().then(() => {
                const file = new SpinalFile(`${connectorName}.conf`, model, { model_type: model.type.get() });
                directory.push(file);
                console.log("organ created");
                return resolve(model);
            });
        });

    });
};

export function GetPm2Instance(organName: string) {
    return new Promise((resolve, reject) => {
        pm2.list((err, apps) => {
            if (err) {
                console.error(err);
                return reject(err);
            }
            const instance = apps.find((app) => app.name === organName);

            resolve(instance);
        });
    });
};

function findFileInDirectory(directory: spinal.Directory, fileName: string): Promise<SpinalOrganSNMP | void> {
    return new Promise((resolve, reject) => {
        for (let index = 0; index < directory.length; index++) {
            const element = directory[index];
            const elementName = element.name.get();
            if (elementName.toLowerCase() === `${fileName}.conf`.toLowerCase()) {
                return element.load((file) => {
                    WaitModelReady().then(() => {
                        resolve(file);
                    });
                });
            }
        }

        resolve(undefined);
    });
}

export const WaitModelReady = (): Promise<any> => {
    const deferred = Q.defer();
    const WaitModelReadyLoop = (defer) => {
        if (FileSystem._sig_server === false) {
            setTimeout(() => {
                defer.resolve(WaitModelReadyLoop(defer));
            }, 200);
        } else {
            defer.resolve();
        }
        return defer.promise;
    };
    return WaitModelReadyLoop(deferred);
};


export const connectionErrorCallback = (err?: Error): void => {
    if (!err) console.error('Error Connect');
    else console.error('Error Connect', err)
    process.exit(0);
}


////////////////////////////////////////////////
////                 CALLBACKS                //
////////////////////////////////////////////////

export const SpinalDiscoverCallback = async (spinalDisoverModel: SpinalSNMPDiscover, organModel: SpinalOrganSNMP): Promise<void | boolean> => {
    await WaitModelReady();

    const organMatched = await checkIfItsSameOrgan(organModel, spinalDisoverModel);
    if (!organMatched) return;

    //////  
    // Timeout after 2 minutes, and remove discover from graph
    //  ///////
    const minute = 2 * (60 * 1000)
    const time = Date.now();
    const creation = spinalDisoverModel.creation?.get() || 0;

    if ((time - creation) >= minute || spinalDisoverModel.state.get() === STATES.created) {
        spinalDisoverModel.changeState(STATES.timeout);
        return spinalDisoverModel.remove();
    }
    //////////////////////////////////////////

    SpinalDiscover.getInstance().addToDiscoverQueue(spinalDisoverModel);


}

export const SpinalListnerCallback = async (spinalListenerModel: SpinalSNMPListener, organModel: SpinalOrganSNMP): Promise<void> => {
    await WaitModelReady();
    const organMatched = await checkIfItsSameOrgan(organModel, spinalListenerModel);

    if (organMatched) {
        SpinalMonitoring.getInstance().addToMonitoringQueue(spinalListenerModel);
    }

}

export const SpinalPilotCallback = async (spinalPilotModel: SpinalSNMPPilot, organModel: SpinalOrganSNMP): Promise<void> => {
    await WaitModelReady();
    const organMatched = await checkIfItsSameOrgan(organModel, spinalPilotModel);
    if (!organMatched) return;

    //////  
    // Timeout after 2 minutes, and remove pilote request from graph
    //  ///////
    const minute = 2 * (60 * 1000)
    const time = Date.now();
    const creation = spinalPilotModel.creation?.get() || 0;
    const state = spinalPilotModel.state.get();

    if ((time - creation) >= minute || ["success", "error"].includes(state)) {
        spinalPilotModel.setErrorMode();
        return spinalPilotModel.removeFromGraph();
    }

    /////////////////////////////////////////

    const spinalPilot = new SpinalPilot(spinalPilotModel);
    await spinalPilot.sendPilotRequest();
}



async function checkIfItsSameOrgan(organ: SpinalOrganSNMP, modelReceived: SpinalSNMPDiscover | SpinalSNMPListener | SpinalSNMPPilot): Promise<SpinalOrganSNMP | void> {
    let organNode: SpinalNode = await modelReceived?.getOrgan();

    if (organNode instanceof SpinalNode) {
        organNode = await organNode.getElement(true);
    }

    return organ?._server_id === organNode?._server_id && organNode;
}


/**
 * Binds the organ models (discover, pilot, listener) to their respective callbacks
 * @param organModel 
 */
export async function bindModels(organModel: SpinalOrganSNMP): Promise<void> {

    const { discover, listener, pilot } = await organModel.getModels();

    const listenerAlreadyBinded = new Set<number>();
    const discoverAlreadyBinded = new Set<number>();

    //////////////// 
    //bind discover model[discover]
    ////////////////
    discover.modification_date.bind(async () => {
        const discoverList = await organModel.getDiscoverModelFromGraph();

        for (const spinalDiscoverModel of discoverList) {
            if (discoverAlreadyBinded.has(spinalDiscoverModel._server_id)) continue;

            SpinalDiscoverCallback(spinalDiscoverModel, organModel)
            discoverAlreadyBinded.add(spinalDiscoverModel._server_id);
        }
    })

    ///////////////
    //  bind pilot model [write value to bacnet device]
    ///////////////
    pilot.modification_date.bind(async () => {
        const pilotList = await organModel.getPilotModelFromGraph();

        for (const spinalPilotModel of pilotList) {
            SpinalPilotCallback(spinalPilotModel, organModel);
        }
    }, true);


    ////////////
    //  bind listener model [monitoring bacnet device]
    ////////////
    listener.modification_date.bind(async () => {
        const listenerList = await organModel.getListenerModelFromGraph();

        for (let i = 0; i < listenerList.length; i++) {
            const spinalListenerModel = listenerList[i];

            if (listenerAlreadyBinded.has(spinalListenerModel._server_id)) continue;

            SpinalListnerCallback(spinalListenerModel, organModel);
            listenerAlreadyBinded.add(spinalListenerModel._server_id);
        }
    }, true);
}


/**
 * Waits for the specified number of milliseconds.
 * @param ms Number of milliseconds to wait.
 * @returns Promise that resolves after the given time.
 */
export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}