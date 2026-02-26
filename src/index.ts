
import * as path from "path";
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

import { spinalCore } from "spinal-core-connectorjs_type";
import config from "./config";
import { bindModels } from "./utilities/Functions";
import { SpinalOrganSNMP } from "spinal-model-snmp";
import { IConnectorInfo, SpinalConnectorService } from "spinal-connector-service"
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
    spinalConnectorService._bindRestart(); // Bind the restart function to PM2 events

    const message = alreadyExists ? "organ found !" : "organ not found, creating new organ !";
    console.log(message);

    bindModels(node as SpinalOrganSNMP);

}).catch((error) => {
    console.error(error);
});


