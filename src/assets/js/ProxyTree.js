import {reactive} from "vue";
import {ComputedNodeMap, SourceNodeMap} from "./NodeMap.js";
import {createCopyOnWriteProxy, createMutableReferenceProxy, createProxyNode} from "./Proxies.js";

export class ProxyTree {

    constructor(nodeMap, rootId) {
        this.nodeMap = nodeMap;
        this.proxyNodes = new Map();
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

export class SourceTree extends ProxyTree {

    constructor(rootNode) {
        super(new SourceNodeMap());
        const rootId = this.nodeMap.addNode(rootNode);
        this.root = this.createProxyChild(rootId, null);
    }

    createProxyChild(id, parentId) {
        console.assert(!parentId || this.proxyNodes.get(parentId),
            `Cannot create proxy child: there is no proxy node for the parent (id ${parentId})`);

        const parentProxy = this.proxyNodes.get(parentId);

        let proxyNode = createMutableReferenceProxy(this.nodeMap, id);
        proxyNode = createProxyNode(this.getChildren, proxyNode,)
        return proxyNode;
    }
}

export class ComputedTree extends ProxyTree {

    constructor(srcNodeMap, rootId) {
        let computedNodeMap = new ComputedNodeMap(srcNodeMap);
        super(computedNodeMap, rootId);
        this.computedNodeMap = computedNodeMap;
        this.root = this.createProxyChild(rootId, null);
    }

    createProxyChild(id, parentId) {

        console.assert(!parentId || this.proxyNodes.get(parentId),
            `Cannot create proxy child: there is no proxy node for the parent (id ${parentId})`);

        const parentProxy = this.proxyNodes.get(parentId);
        let refProxy = createCopyOnWriteProxy(this.computedNodeMap, id);
        return createProxyNode(this.getChildren, refProxy, parentProxy);
    }
}