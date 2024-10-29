import {NodeMap} from "../NodeMap.js";
import * as Proxies from "../Proxies.js";
import {readonly} from "vue";

export class ProxyTree extends NodeMap {

    constructor(nodeMap) {
        super();
        this.nodeMap = nodeMap; // TODO make the node map immutable when returned
        this.proxyNodes = new Map();
        this.root = null;
    }

    setRoot(id) {
        this.root = this.getNode(id);
    }

    getNode(id) {
        this.getProxyNode(id);
    }

    addNode(node) {
        return this.nodeMap.addNode(node);
    }

    deleteNode(id) {
        this.nodeMap.deleteNode(id);
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