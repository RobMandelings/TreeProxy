import {ComputedNodeMap, SourceNodeMap} from "./NodeMap.js";
import * as Proxies from "./Proxies.js";

export class ProxyTree {

    constructor(nodeMap) {
        this.nodeMap = nodeMap;
        this.proxyNodes = new Map();
    }

    createRefProxyNode(id) {

    }

    getProxyNode(id) {
        // TODO do a find when there are no proxy nodes inside the map
        return this.proxyNodes.get(id);
    }

    createProxyNode(id, parentId) {
        console.assert(!this.proxyNodes.has(id));
        console.assert(!parentId || this.proxyNodes.get(parentId),
            `Cannot create proxy child: there is no proxy node for the parent (id ${parentId})`);

        let proxyNode = this.createRefProxyNode(id);
        proxyNode = Proxies.createProxyNode(this, proxyNode, parentId);
        this.proxyNodes.set(id, proxyNode);
        return proxyNode;
    }

    getChildren(id) {
        return this.nodeMap.getNode(id).childrenIds.map(cId => {
            return this.proxyNodes.get(cId)
                ?? this.createProxyNode(cId, id);
        });
    }

    moveTo(nodeId, parentId) {
    }
}

export class SourceTree extends ProxyTree {

    constructor(rootNode) {
        super(new SourceNodeMap());
        const rootId = this.nodeMap.addNode(rootNode);
        this.root = this.createProxyNode(rootId, null);
    }

    createRefProxyNode(id) {
        return Proxies.createMutableReferenceProxy(this.nodeMap, id);
    }
}

export class ComputedTree extends ProxyTree {

    constructor(srcNodeMap, rootId) {
        let computedNodeMap = new ComputedNodeMap(srcNodeMap);
        super(computedNodeMap);
        this.root = this.createProxyNode(rootId, null);
    }

    createRefProxyNode(id) {
        return Proxies.createCopyOnWriteProxy(this.nodeMap, id);
    }
}