"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAllEndpointsToDevice = addAllEndpointsToDevice;
exports.createAndAddEndpointsToDevice = createAndAddEndpointsToDevice;
exports._getNodeAlreadyInGraph = _getNodeAlreadyInGraph;
const spinal_model_graph_1 = require("spinal-model-graph");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
async function addAllEndpointsToDevice(context, nodes, parentNode, nodesAlreadyCreated) {
    const promises = nodes.map(async (node) => {
        let endpointNode = nodesAlreadyCreated[node.oid];
        if (endpointNode) {
            return _updateEndointNode(endpointNode, node);
        }
        return createAndAddEndpointsToDevice(context, node, parentNode);
    });
    return Promise.all(promises);
}
async function createAndAddEndpointsToDevice(context, nodeInfo, deviceNode) {
    const endpointNode = await _createEndpointNode(nodeInfo);
    return deviceNode.addChildInContext(endpointNode, spinal_model_bmsnetwork_1.SpinalBmsEndpoint.relationName, spinal_model_graph_1.SPINAL_RELATION_PTR_LST_TYPE, context);
}
async function _getNodeAlreadyInGraph(context, deviceNode) {
    const nodeAlreadyInGraph = {};
    return deviceNode.findInContext(context, (node) => {
        if (node.getType().get() === spinal_model_bmsnetwork_1.SpinalBmsEndpoint.nodeTypeName) {
            nodeAlreadyInGraph[node.info.idNetwork.get()] = node;
            return true;
        }
        return false;
    }).then(() => {
        return nodeAlreadyInGraph;
    });
}
async function _updateEndointNode(endpointNode, node) {
    const endpointElement = await endpointNode.getElement(true);
    //// update endpoint node info
    endpointNode.info.idNetwork.set(node.oid); // Update OID
    endpointNode.info.name.set(node.name); // Update name
    //// update endpoint element info
    endpointElement.name.set(node.name); // Update name
    endpointElement.dataType.set(node.type); // Update type
    endpointElement.currentValue.set(node.value); // Update value
    return endpointNode;
}
async function _createEndpointNode(node) {
    const inputDataEndpoint = {
        id: node.oid,
        name: node.name,
        path: "",
        currentValue: node.value,
        unit: "",
        dataType: String(node.type),
        type: spinal_model_bmsnetwork_1.SpinalBmsEndpoint.nodeTypeName,
    };
    const endpointElement = new spinal_model_bmsnetwork_1.SpinalBmsEndpoint(inputDataEndpoint);
    const endpointNode = new spinal_model_graph_1.SpinalNode(inputDataEndpoint.name, inputDataEndpoint.type, endpointElement);
    endpointNode.info.add_attr({ idNetwork: endpointElement.id });
    return _createEndpointAttributes(endpointElement, endpointNode).then(() => {
        return endpointNode;
    });
}
function _createEndpointAttributes(element, node) {
    const categoryName = "default";
    return spinal_env_viewer_plugin_documentation_service_1.serviceDocumentation.addCategoryAttribute(node, categoryName).then((attributeCategory) => {
        const attributes = [];
        for (const key of element._attribute_names) {
            attributes.push(spinal_env_viewer_plugin_documentation_service_1.serviceDocumentation.addAttributeByCategory(node, attributeCategory, key, element[key]));
        }
        return attributes;
    }).catch((err) => {
        console.error(`Error creating attributes for endpoint ${element.name.get()}:`, err.message);
        return [];
    });
}
//# sourceMappingURL=transformTreeToGraph.js.map