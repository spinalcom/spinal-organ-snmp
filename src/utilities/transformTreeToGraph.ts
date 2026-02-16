import { SPINAL_RELATION_PTR_LST_TYPE, SpinalContext, SpinalNode } from "spinal-model-graph";
import { IOidTreeNode } from "../types";
import NetworkService, { InputDataEndpoint, SpinalBmsEndpoint } from "spinal-model-bmsnetwork";
import { serviceDocumentation } from 'spinal-env-viewer-plugin-documentation-service';
import { SpinalAttribute } from "spinal-models-documentation";


export async function addAllEndpointsToDevice(context: SpinalContext, nodes: IOidTreeNode[], parentNode: SpinalNode, nodesAlreadyCreated: { [key: string]: SpinalNode }): Promise<SpinalNode[]> {

    const promises = nodes.map(async (node) => {
        let endpointNode = nodesAlreadyCreated[node.oid];

        if (endpointNode) {
            return _updateEndointNode(endpointNode, node);
        }

        return createAndAddEndpointsToDevice(context, node, parentNode);
    })

    return Promise.all(promises);
}

export async function createAndAddEndpointsToDevice(context: SpinalContext, nodeInfo: IOidTreeNode, deviceNode: SpinalNode): Promise<SpinalNode> {
    const endpointNode = await _createEndpointNode(nodeInfo);
    return deviceNode.addChildInContext(endpointNode, SpinalBmsEndpoint.relationName, SPINAL_RELATION_PTR_LST_TYPE, context);
}

export async function _getNodeAlreadyInGraph(context: SpinalContext, deviceNode: SpinalNode): Promise<{ [key: string]: SpinalNode }> {
    const nodeAlreadyInGraph = {};
    return deviceNode.findInContext(context, (node) => {
        if (node.getType().get() === SpinalBmsEndpoint.nodeTypeName) {
            nodeAlreadyInGraph[node.info.idNetwork.get()] = node;
            return true;
        }
        return false;
    }).then(() => {
        return nodeAlreadyInGraph;
    })
}



async function _updateEndointNode(endpointNode: SpinalNode, node: IOidTreeNode) {
    const endpointElement: SpinalBmsEndpoint = await endpointNode.getElement(true);

    //// update endpoint node info
    endpointNode.info.idNetwork.set(node.oid); // Update OID
    endpointNode.info.name.set(node.name); // Update name

    //// update endpoint element info
    endpointElement.name.set(node.name); // Update name
    endpointElement.dataType.set(node.type); // Update type
    endpointElement.currentValue.set(node.value); // Update value


    return endpointNode;
}

async function _createEndpointNode(node: IOidTreeNode): Promise<SpinalNode> {
    const inputDataEndpoint = {
        id: node.oid,
        name: node.name,
        path: "",
        currentValue: node.value,
        unit: "",
        dataType: String(node.type),
        type: SpinalBmsEndpoint.nodeTypeName,
    }

    const endpointElement = new SpinalBmsEndpoint(inputDataEndpoint as InputDataEndpoint);
    const endpointNode = new SpinalNode(inputDataEndpoint.name, inputDataEndpoint.type, endpointElement);

    endpointNode.info.add_attr({ idNetwork: endpointElement.id })

    return _createEndpointAttributes(endpointElement, endpointNode).then(() => {
        return endpointNode;
    });
}



function _createEndpointAttributes(element: SpinalBmsEndpoint, node: SpinalNode): Promise<SpinalAttribute[] | void> {
    const categoryName: string = "default";

    return serviceDocumentation.addCategoryAttribute(node, categoryName).then((attributeCategory) => {
        const attributes: SpinalAttribute[] = [];

        for (const key of element._attribute_names) {
            attributes.push(serviceDocumentation.addAttributeByCategory(node, attributeCategory, key, element[key]))
        }

        return attributes;
    }).catch((err) => {
        console.error(`Error creating attributes for endpoint ${element.name.get()}:`, err.message);
        return [];
    });
}