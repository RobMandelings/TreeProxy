import {ProxyTree} from "./ProxyTree.js";
import {reactive} from "vue";
import {SourceNodeMap} from "../node_map/SourceNodeMap.js";
import {createSrcProxyNode} from "./ProxyNode.js";

export class SourceTree extends ProxyTree {

    constructor() {
        super(reactive(new SourceNodeMap()));
    }

    createProxyNodeFn(id, parentId) {
        return createSrcProxyNode(this, id, parentId)
    }
}