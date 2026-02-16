"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATES = exports.SNMP_ORGAN_TYPE = void 0;
exports.SNMP_ORGAN_TYPE = "SNMP_ORGAN_TYPE";
var STATES;
(function (STATES) {
    STATES[STATES["error"] = -1] = "error";
    STATES[STATES["reseted"] = 0] = "reseted";
    STATES[STATES["discovering"] = 1] = "discovering";
    STATES[STATES["discovered"] = 2] = "discovered";
    STATES[STATES["timeout"] = 3] = "timeout";
    STATES[STATES["creating"] = 4] = "creating";
    STATES[STATES["created"] = 5] = "created";
})(STATES || (exports.STATES = STATES = {}));
//# sourceMappingURL=constants.js.map