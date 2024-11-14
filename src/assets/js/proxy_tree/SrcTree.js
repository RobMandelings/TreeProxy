import {ProxyTree} from "@pt/ProxyTree.js";
import {reactive} from "vue";
import {SourceNodeMap} from "@pt/node_map/SourceNodeMap.js";
import {createSrcProxyNode} from "@pt/ProxyNode.js";

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