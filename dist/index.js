"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const config_1 = require("./config");
const Functions_1 = require("./utilities/Functions");
const spinal_model_snmp_1 = require("spinal-model-snmp");
const spinal_connector_service_1 = require("spinal-connector-service");
const pm2Management_1 = require("./utilities/pm2Management");
//////////////////////////////////////////////////
const { protocol, host, port, userId, password, path: organFolderPath, name: organName } = config_1.default;
const url = `${protocol}://${userId}:${password}@${host}:${port}/`;
const connect = spinal_core_connectorjs_type_1.spinalCore.connect(url);
const spinalConnectorService = spinal_connector_service_1.SpinalConnectorService.getInstance();
const connectorInfo = {
    name: organName,
    type: spinal_model_snmp_1.SpinalOrganSNMP.typeName,
    path: path.normalize(`${organFolderPath}/${organName}.conf`),
    model: new spinal_model_snmp_1.SpinalOrganSNMP(organName)
};
spinalConnectorService.initialize(connect, connectorInfo).then(async ({ alreadyExists, node }) => {
    // Bind the restart function to PM2 events
    const pm2Management = pm2Management_1.PM2Management.getInstance();
    const pm2Instance = await pm2Management.getPm2InstanceByName(organName);
    const pm2_id = pm2Instance ? pm2Instance.pm_id : null;
    if (pm2_id !== null)
        node.restart.bind(() => pm2Management.restartProcessById(pm2_id));
    // end of restart function to bind
    const message = alreadyExists ? "organ found !" : "organ not found, creating new organ !";
    console.log(message);
    (0, Functions_1.bindModels)(node);
}).catch((error) => {
    console.error(error);
});
//# sourceMappingURL=index.js.map