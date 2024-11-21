import {ProxyTree} from "@pt/tree/ProxyTree.js";
import {reactive} from "vue";
import {SrcRefStore} from "@pt/node_ref/SrcRefStore.js";

export class SourceTree extends ProxyTree {

    constructor(nodeMap, proxyNodeFactory) {
        super(reactive(new SrcRefStore(nodeMap)), proxyNodeFactory);
    }

    getSrcNode(id) {
        return this.getElement(id) // Simply return the same node as with getElement. This is already the source node, unlike with Computed tree for example.
    }

    createProxyNodeFn(id, parentId) {
        return this.proxyNodeFactory.createSrcProxyNode(this, id, parentId)
    }
}