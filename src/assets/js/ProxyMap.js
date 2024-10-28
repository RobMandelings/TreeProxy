import {reactive} from "vue";
import {ComputedNodeMap} from "./NodeMap.js";
import {createCopyOnWriteProxy, createParentDecoratorProxy} from "./Proxies.js";

export class ProxyTree {

    constructor(nodeMap) {
        this.nodeMap = nodeMap;
        this.proxyNodes = new Map();
    }

    createProxyChild(id, parentId) {
        // Proxy creation logic here
    }

    getChildren(id) {
        return this.nodeMap.getNode(id).childrenIds.map(cId => {
            return this.proxyNodes.get(cId)
                ?? this.#createProxyChild(cId, id);
        });
    }

    moveTo(nodeId, parentId) {
    }
}

export class ComputedTree extends ProxyTree {

    constructor(srcNodeMap) {
        let computedNodeMap = reactive(new ComputedNodeMap(srcNodeMap));
        super(computedNodeMap);
        this.computedNodeMap = computedNodeMap;
    }

    createProxyChild(id, parentId) {
        let proxyNode = createCopyOnWriteProxy(this.computedNodeMap, id);
        proxyNode = createParentDecoratorProxy(proxyNode, parentId);
        return proxyNode;
    }
}