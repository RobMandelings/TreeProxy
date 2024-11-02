import {ProxyTree} from "./ProxyTree.js";
import {ComputedNodeMap} from "../node_map/ComputedNodeMap.js";

export class ComputedTree extends ProxyTree {

    constructor(srcProxyTree) {
        let computedNodeMap = new ComputedNodeMap(srcProxyTree.nodeMap);
        super(computedNodeMap);
        this.computedNodeMap = computedNodeMap;
    }

    getOverwrittenNodes() {
        return this.computedNodeMap.getOverwrittenNodeIds().map(id => this.getNode(id));
    }

    getAddedNodes() {
        return this.computedNodeMap.getAddedNodeIds().map(id => this.getNode(id));
    }

    getDeletedNodes() {
        return this.computedNodeMap.getDeletedNodeIds();
    }
}