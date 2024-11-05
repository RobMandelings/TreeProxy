import {ProxyTree} from "./ProxyTree.js";
import {OverlayNodeMap} from "../node_map/OverlayNodeMap.js";
import {reactive} from "vue";

export class OverlayTree extends ProxyTree {

    constructor(srcTree) {
        let computedNodeMap = reactive(new OverlayNodeMap(srcTree.nodeMap));
        super(computedNodeMap);
        this.computedNodeMap = computedNodeMap;
        this.initRootId(srcTree.root.id);
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