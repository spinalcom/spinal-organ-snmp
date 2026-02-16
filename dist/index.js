"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const pm2 = require("pm2");
const config_1 = require("./config");
const Functions_1 = require("./utilities/Functions");
//////////////////////////////////////////////////
const { protocol, host, port, userId, password, path: organFolderPath, name: organName } = config_1.default;
const url = `${protocol}://${userId}:${password}@${host}:${port}/`;
const connect = spinal_core_connectorjs_type_1.spinalCore.connect(url);
(0, Functions_1.CreateOrganConfigFile)(connect, organFolderPath, organName).then((organModel) => {
    (0, Functions_1.GetPm2Instance)(organName).then(async (app) => {
        const restart = organModel.restart.get();
        if (!restart) {
            (0, Functions_1.bindModels)(organModel); // bind organ models
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
//# sourceMappingURL=index.js.map