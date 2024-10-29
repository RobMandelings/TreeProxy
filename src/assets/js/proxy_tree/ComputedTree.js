import {ComputedNodeMap, NodeMap, SourceNodeMap} from "../NodeMap.js";
import * as Proxies from "../Proxies.js";
import {ProxyTree} from "./ProxyTree.js";

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
        return Proxies.createCopyOnWriteProxy(this.nodeMap, id);
    }
}