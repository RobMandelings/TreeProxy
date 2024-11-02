import {ProxyTree} from "./ProxyTree.js";
import {SourceNodeMap} from "../node_map/NodeMap.js";
import {createMutableReferenceProxy} from "./RefProxy.js";
import {reactive} from "vue";

export class SourceTree extends ProxyTree {

    constructor() {
        super(reactive(new SourceNodeMap()));
    }

    createRefProxyNode(id) {
        return createMutableReferenceProxy(this.nodeMap, id);
    }
}