import {ProxyTree} from "./ProxyTree.js";
import {ComputedNodeMap} from "../node_map/ComputedNodeMap.js";
import {reactive} from "vue";

export class ComputedTree extends ProxyTree {

    constructor(srcProxyTree) {
        let computedNodeMap = reactive(new ComputedNodeMap(srcProxyTree.nodeMap));
        super(computedNodeMap);
        this.computedNodeMap = computedNodeMap;
        this.initRootId(srcProxyTree.root.id);
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