import {ComputedNodeMap, SourceNodeMap} from "./NodeMap.js";
import {createCopyOnWriteProxy, createMutableReferenceProxy, createProxyNode} from "./Proxies.js";

export class ProxyTree {

    constructor(nodeMap) {
        this.nodeMap = nodeMap;
        this.proxyNodes = new Map();
    }

    createRefProxy(id) {

    }

    getProxyNode(id) {
        // TODO do a find when there are no proxy nodes inside the map
        return this.proxyNodes.get(id);
    }

    createProxyChild(id, parentId) {
        console.assert(!this.proxyNodes.has(id));
        console.assert(!parentId || this.proxyNodes.get(parentId),
            `Cannot create proxy child: there is no proxy node for the parent (id ${parentId})`);

        let proxyNode = this.createRefProxy(id);
        proxyNode = createProxyNode(this, proxyNode, parentId);
        this.proxyNodes.set(id, proxyNode);
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