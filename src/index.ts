
import * as path from "path";
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

import { spinalCore } from "spinal-core-connectorjs_type";
import config from "./config";
import { bindModels } from "./utilities/Functions";
import { SpinalOrganSNMP } from "spinal-model-snmp";
import { IConnectorInfo, SpinalConnectorService } from "spinal-connector-service"
import { PM2Management } from "./utilities/pm2Management";
//////////////////////////////////////////////////

const { protocol, host, port, userId, password, path: organFolderPath, name: organName } = config;
const url = `${protocol}://${userId}:${password}@${host}:${port}/`;
const connect = spinalCore.connect(url);


const spinalConnectorService = SpinalConnectorService.getInstance();

const connectorInfo: IConnectorInfo = {
    name: organName,
    type: SpinalOrganSNMP.typeName,
    path: path.normalize(`${organFolderPath}/${organName}.conf`),
    model: new SpinalOrganSNMP(organName)
}

spinalConnectorService.initialize(connect, connectorInfo).then(({ alreadyExists, node }) => {

    // Bind the restart function to PM2 events
    const pm2Management = PM2Management.getInstance();
    const pm2Instance = pm2Management.getPm2InstanceByName(organName);
    const pm2_id = pm2Instance ? (pm2Instance as any).pm_id : null;
    if (pm2_id !== null) node.restart.bind(() => pm2Management.restartProcessById(pm2_id));
    // end of restart function to bind

    const message = alreadyExists ? "organ found !" : "organ not found, creating new organ !";
    console.log(message);

    bindModels(node as SpinalOrganSNMP);

}).catch((error) => {
    console.error(error);
});


