import { SpinalSNMPPilot } from "spinal-model-snmp";
import { IRequest } from "../types";
import SnmpUtils from "../utilities/SnmpUtils";


class SpinalPilot {
    // private static instance: SpinalPilot;
    public pilotModel: SpinalSNMPPilot;

    public constructor(model: SpinalSNMPPilot) {
        this.pilotModel = model;
    }


    public sendPilotRequest() {
        let requests: IRequest | IRequest[] = this.pilotModel.requests.get();
        const addressToRequests = this._formatAndClassifyRequests(requests);

        const promises = Object.keys(addressToRequests).map((address) => {
            console.log("Sending pilot request to", address, "with data", addressToRequests[address]);
            return SnmpUtils.getInstance().setOidValue(address, addressToRequests[address])
        });

        return Promise.all(promises).then(() => {
            this.pilotModel.setSuccessMode();
            console.log("Pilot request successful");
        }).catch((err) => {
            console.log(`Error while sending pilot request due to: ${err.message}`);
            this.pilotModel.setErrorMode();
        });

    }


    public _formatAndClassifyRequests(requests: IRequest | IRequest[]): { [key: string]: IRequest[] } {
        if (!Array.isArray(requests)) requests = [requests];

        const obj = {};

        for (const request of requests) {
            const address = request.address;
            if (!obj[address]) obj[address] = [];
            obj[address].push({
                ...request,
                oid: SnmpUtils._formatOid(request.oid),
                value: SnmpUtils._formatValue(request.value, request.type),
                type: SnmpUtils._formatTypeValue(request.type)
            });
        }

        return obj;

    }
}

export default SpinalPilot;
export { SpinalPilot };