import {reactive} from "vue";
import {ComputedNodeMap} from "./NodeMap.js";
import {createCopyOnWriteProxy, createProxyNode} from "./Proxies.js";

export class ProxyTree {

    constructor(nodeMap, rootId) {
        this.nodeMap = nodeMap;
        this.proxyNodes = new Map();
        this.root = this.createProxyChild(rootId, null);
    }

    createProxyChild(id, parentId) {
    }

    getChildren(id) {
        return this.nodeMap.getNode(id).childrenIds.map(cId => {
            return this.proxyNodes.get(cId)
                ?? this.createProxyChild(cId, id);
        });
    }

    moveTo(nodeId, parentId) {
    }
}

export class ComputedTree extends ProxyTree {

    constructor(srcNodeMap, rootId) {
        let computedNodeMap = new ComputedNodeMap(srcNodeMap);
        super(computedNodeMap, rootId);
        this.computedNodeMap = computedNodeMap;
    }

    createProxyChild(id, parentId) {

        console.assert(!parentId || this.proxyNodes.get(parentId),
            `Cannot create proxy child: there is no proxy node for the parent (id ${parentId})`);

        const parentProxy = this.proxyNodes.get(parentId);
        let refProxy = createCopyOnWriteProxy(this.computedNodeMap, id);
        return createProxyNode(this.getChildren, refProxy, parentProxy);
    }
}