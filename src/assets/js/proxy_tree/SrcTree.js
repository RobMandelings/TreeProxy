import {ProxyTree} from "./ProxyTree.js";
import {SourceNodeMap} from "../NodeMap.js";
import {createMutableReferenceProxy} from "./RefProxy.js";

export class SourceTree extends ProxyTree {

    constructor() {
        super(new SourceNodeMap());
    }

    createRefProxyNode(id) {
        return createMutableReferenceProxy(this.nodeMap, id);
    }
}