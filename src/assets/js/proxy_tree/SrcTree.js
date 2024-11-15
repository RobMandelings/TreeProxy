import {ProxyTree} from "@pt/ProxyTree.js";
import {reactive} from "vue";
import {SrcElementMap} from "@pt/node_map/SrcElementMap.js";

export class SourceTree extends ProxyTree {

    constructor() {
        super(reactive(new SrcElementMap()));
    }

    getSrcNode(id) {
        return this.getElement(id) // Simply return the same node as with getElement. This is already the source node, unlike with Computed tree for example.
    }

    createProxyNodeFn(id, parentId) {
        return this.proxyNodeFactory.createSrcProxyNode(this, id, parentId)
    }
}