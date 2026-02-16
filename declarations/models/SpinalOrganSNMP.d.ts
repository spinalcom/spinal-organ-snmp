import { Lst, Model } from "spinal-core-connectorjs";
import { SpinalNode } from "spinal-model-graph";
import ModelsInfo from "./modelsToBind";
import SpinalSNMPDiscover from "./SpinalSNMPDiscover";
import SpinalSNMPPilot from "./SpinalSNMPPilot";
import SpinalSNMPListener from "./SpinalSNMPListener";
declare class SpinalOrganSNMP extends Model {
    static TYPE: string;
    static CONTEXT_TO_ORGAN_RELATION: string;
    references: any;
    constructor(name?: string, type?: string);
    private _initializeModelsList;
    getModels(): {
        discover: ModelsInfo<SpinalSNMPDiscover>;
        pilot: ModelsInfo<SpinalSNMPPilot>;
        listener: ModelsInfo<SpinalSNMPListener>;
    };
    addReference(contextId: string, spinalNode: SpinalNode<any>): Promise<SpinalNode<any>>;
    isReferencedInContext(contextId: string): Promise<boolean>;
    removeReference(contextId: string): Promise<SpinalNode> | void;
    addDiscoverModelToGraph(discoverModel: SpinalSNMPDiscover): Promise<number>;
    addPilotModelToGraph(discoverModel: SpinalSNMPPilot): Promise<number>;
    addListenerModelToGraph(discoverModel: SpinalSNMPListener): Promise<number>;
    removeDiscoverModelFromGraph(discoverModel: SpinalSNMPDiscover): Promise<boolean>;
    removePilotModelFromGraph(discoverModel: SpinalSNMPPilot): Promise<boolean>;
    removeListenerModelFromGraph(discoverModel: SpinalSNMPListener): Promise<boolean>;
    getDiscoverModelFromGraph(): Promise<Lst<SpinalSNMPDiscover>>;
    getPilotModelFromGraph(): Promise<Lst<SpinalSNMPPilot>>;
    getListenerModelFromGraph(): Promise<Lst<SpinalSNMPListener>>;
    consumeDiscoverModelFromGraph(): Promise<SpinalSNMPDiscover[]>;
    consumePilotModelFromGraph(): Promise<SpinalSNMPPilot[]>;
    consumeListenerModelFromGraph(): Promise<SpinalSNMPListener[]>;
}
export default SpinalOrganSNMP;
export { SpinalOrganSNMP };
