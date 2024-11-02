import {ComputedNodeMap, NodeMap, SourceNodeMap} from "../node_map/NodeMap.js";
import {ProxyTree} from "./ProxyTree.js";
import {createCopyOnWriteProxy} from "./RefProxy.js";

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

    createRefProxyNode(id) {
        return createCopyOnWriteProxy(this.nodeMap, id);
    }
}