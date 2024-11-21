import {Tree} from "@pt/tree/Tree.js";
import {reactive} from "vue";
import {SrcRefStore} from "@pt/ref_store/SrcRefStore.js";

export class SourceTree extends Tree {

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