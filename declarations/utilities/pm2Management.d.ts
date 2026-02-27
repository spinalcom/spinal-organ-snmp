import * as pm2 from 'pm2';
export declare class PM2Management {
    private static _instance;
    private constructor();
    static getInstance(): PM2Management;
    getPm2InstanceByName(name: string): Promise<pm2.ProcessDescription | null>;
    restartProcessById(instanceId: string | number): Promise<boolean>;
}
