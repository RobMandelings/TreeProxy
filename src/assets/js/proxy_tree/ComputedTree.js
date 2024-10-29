import {ComputedNodeMap, NodeMap, SourceNodeMap} from "../NodeMap.js";
import * as Proxies from "../Proxies.js";
import {ProxyTree} from "./ProxyTree.js";

export class ComputedTree extends ProxyTree {

    constructor(srcProxyTree) {
        let computedNodeMap = new ComputedNodeMap(srcProxyTree.nodeMap);
        super(computedNodeMap);
        this.computedNodeMap = computedNodeMap;
    }

    getAddedNodes() {
        throw new Error("Not implemented yet");
    }

    getDeletedNodes() {
        return this.computedNodeMap.getDeletedNodes();
    }

    createRefProxyNode(id) {
        return Proxies.createCopyOnWriteProxy(this.nodeMap, id);
    }
}