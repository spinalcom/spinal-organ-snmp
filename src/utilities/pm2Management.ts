import * as pm2 from 'pm2';

export class PM2Management {
    private static _instance: PM2Management;

    private constructor() { }

    public static getInstance(): PM2Management {
        if (!this._instance) {
            this._instance = new PM2Management();
        }
        return this._instance;
    }


    public getPm2InstanceByName(name: string): Promise<pm2.ProcessDescription | null> {
        return new Promise((resolve, reject) => {
            pm2.connect((err) => {
                if (err) return resolve(null);

                pm2.list((err: Error, apps: pm2.ProcessDescription[]) => {
                    if (err) {
                        return resolve(null);
                    }
                    const instance = apps.find(app => app.name === name);
                    resolve(instance || null);
                });
            });

        });
    }

    public restartProcessById(instanceId: string | number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            pm2.restart(instanceId, (err) => {
                if (err) return resolve(false);
                resolve(true);
            });
        });
    }

}