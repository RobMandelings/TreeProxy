import {ProxyTree} from "@pt/ProxyTree.js";
import {reactive} from "vue";
import {SourceNodeMap} from "@pt/node_map/SourceNodeMap.js";

export class SourceTree extends ProxyTree {

    constructor(proxyNodeFactory) {
        super(reactive(new SourceNodeMap()), proxyNodeFactory);
    }

    getSrcNode(id) {
        return this.getNode(id) // Simply return the same node as with getNode. This is already the source node, unlike with Computed tree for example.
    }

    createProxyNodeFn(id, parentId) {
        return this.proxyNodeFactory.createSrcProxyNode(this, id, parentId)
    }
}