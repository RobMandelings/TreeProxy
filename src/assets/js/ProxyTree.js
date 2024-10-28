import {reactive} from "vue";
import {ComputedNodeMap, SourceNodeMap} from "./NodeMap.js";
import {createCopyOnWriteProxy, createMutableReferenceProxy, createProxyNode} from "./Proxies.js";

export class ProxyTree {

    constructor(nodeMap) {
        this.nodeMap = nodeMap;
        this.proxyNodes = new Map();
    }

    createRefProxy(id) {

    }

    createProxyChild(id, parentId) {
        console.assert(!parentId || this.proxyNodes.get(parentId),
            `Cannot create proxy child: there is no proxy node for the parent (id ${parentId})`);

        const parentProxy = this.proxyNodes.get(parentId);
        let proxyNode = this.createRefProxy(id);
        proxyNode = createProxyNode(this.getChildren, proxyNode, parentProxy);
        return proxyNode;
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

    createRefProxy(id) {
        return createMutableReferenceProxy(this.nodeMap, id);
    }
}

export class ComputedTree extends ProxyTree {

    constructor(srcNodeMap, rootId) {
        let computedNodeMap = new ComputedNodeMap(srcNodeMap);
        super(computedNodeMap);
        this.root = this.createProxyChild(rootId, null);
    }

    createRefProxy(id) {
        return createCopyOnWriteProxy(this.nodeMap, id);
    }
}