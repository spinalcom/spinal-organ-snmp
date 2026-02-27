"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PM2Management = void 0;
const pm2 = require("pm2");
class PM2Management {
    constructor() { }
    static getInstance() {
        if (!this._instance) {
            this._instance = new PM2Management();
        }
        return this._instance;
    }
    getPm2InstanceByName(name) {
        return new Promise((resolve, reject) => {
            pm2.connect((err) => {
                if (err)
                    return resolve(null);
                pm2.list((err, apps) => {
                    if (err) {
                        return resolve(null);
                    }
                    const instance = apps.find(app => app.name === name);
                    resolve(instance || null);
                });
            });
        });
    }
    restartProcessById(instanceId) {
        return new Promise((resolve, reject) => {
            pm2.restart(instanceId, (err) => {
                if (err)
                    return resolve(false);
                resolve(true);
            });
        });
    }
}
exports.PM2Management = PM2Management;
//# sourceMappingURL=pm2Management.js.map