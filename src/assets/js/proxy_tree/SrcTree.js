import {ProxyTree} from "./ProxyTree.js";
import {reactive} from "vue";
import {SourceNodeMap} from "./node_map/SourceNodeMap.js";
import {createSrcProxyNode} from "./ProxyNode.js";

export class SourceTree extends ProxyTree {

    constructor() {
        super(reactive(new SourceNodeMap()));
    }

    getSrcNode(id) {
        return this.getNode(id) // Simply return the same node as with getNode. This is already the source node, unlike with Computed tree for example.
    }

    createProxyNodeFn(id, parentId) {
        return createSrcProxyNode(this, id, parentId)
    }
}