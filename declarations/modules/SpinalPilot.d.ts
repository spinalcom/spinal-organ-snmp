import { SpinalSNMPPilot } from "spinal-model-snmp";
import { IRequest } from "../types";
declare class SpinalPilot {
    pilotModel: SpinalSNMPPilot;
    constructor(model: SpinalSNMPPilot);
    sendPilotRequest(): Promise<void>;
    _formatAndClassifyRequests(requests: IRequest | IRequest[]): {
        [key: string]: IRequest[];
    };
}
export default SpinalPilot;
export { SpinalPilot };
