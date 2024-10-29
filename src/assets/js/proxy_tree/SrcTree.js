import {ProxyTree} from "./ProxyTree.js";
import {SourceNodeMap} from "../NodeMap.js";
import * as Proxies from "../Proxies.js";

export class SourceTree extends ProxyTree {

    constructor() {
        super(new SourceNodeMap());
    }

    createRefProxyNode(id) {
        return Proxies.createMutableReferenceProxy(this.nodeMap, id);
    }
}