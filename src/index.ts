
import * as path from "path";
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

import { FileSystem, spinalCore } from "spinal-core-connectorjs_type";
import * as pm2 from "pm2";
import config from "./config";
import { bindModels, CreateOrganConfigFile, GetPm2Instance } from "./utilities/Functions";
import { SpinalOrganSNMP } from "spinal-model-snmp";
import SnmpUtils from "./utilities/SnmpUtils";

//////////////////////////////////////////////////

const { protocol, host, port, userId, password, path: organFolderPath, name: organName } = config;
const url = `${protocol}://${userId}:${password}@${host}:${port}/`;
const connect = spinalCore.connect(url);


CreateOrganConfigFile(connect, organFolderPath, organName).then((organModel: SpinalOrganSNMP) => {
    GetPm2Instance(organName).then(async (app: any) => {
        const restart = organModel.restart.get();

        if (!restart) {
            bindModels(organModel); // bind organ models
            return;
        }


        if (app) {
            console.log("restart organ", app.pm_id);
            organModel.restart.set(false);

            pm2.restart(app.pm_id, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log("organ restarted with success !");
            });
        }
    });
}).catch((error) => {
    console.error("Error creating organ config file:", error);
});




// (async () => {
//     const ip = "127.0.0.1:1161";
//     const community = "public";
//     const instance = SnmpUtils.getInstance();

//     const data = await instance.discover(ip, community);
//     // const values = await instance.getOidsValues(ip, data.interfaces.map(o => o.oid));
//     const values = await instance.getOidsValuesAsObject(ip, data.interfaces.map(o => o.oid));

//     console.log(values);
// })();

