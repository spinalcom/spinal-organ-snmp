"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalPilot = void 0;
const SnmpUtils_1 = require("../utilities/SnmpUtils");
class SpinalPilot {
    constructor(model) {
        this.pilotModel = model;
    }
    sendPilotRequest() {
        let requests = this.pilotModel.request.get();
        const addressToRequests = this._formatAndClassifyRequests(requests);
        const promises = Object.keys(addressToRequests).map((address) => SnmpUtils_1.default.getInstance().setOidValue(address, addressToRequests[address]));
        return Promise.all(promises).then(() => {
            this.pilotModel.setSuccessMode();
        }).catch((err) => {
            console.log(`Error while sending pilot request du to: ${err.message}`);
            this.pilotModel.setErrorMode();
        });
    }
    _formatAndClassifyRequests(requests) {
        if (!Array.isArray(requests))
            requests = [requests];
        const obj = {};
        for (const request of requests) {
            const address = request.address;
            if (!obj[address])
                obj[address] = [];
            obj[address].push({
                ...request,
                oid: SnmpUtils_1.default._formatOid(request.oid),
                value: SnmpUtils_1.default._formatValue(request.value, request.type),
                type: SnmpUtils_1.default._formatTypeValue(request.type)
            });
        }
        return obj;
    }
}
exports.SpinalPilot = SpinalPilot;
exports.default = SpinalPilot;
//# sourceMappingURL=SpinalPilot.js.map