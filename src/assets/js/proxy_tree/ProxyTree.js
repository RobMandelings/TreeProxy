import {NodeMap} from "../NodeMap.js";
import * as ProxyNode from "../proxy_tree/ProxyNode.js"
import {readonly} from "vue";
import * as Utils from "../Utils.js";

export class ProxyTree extends NodeMap {

    constructor(nodeMap) {
        super();
        this.nodeMap = nodeMap; // TODO make the node map immutable when returned
        this.proxyNodes = new Map();
        this.root = null;
    }

    init(rootId) {
        this.root = this.createProxyNode(rootId, null);
        const idsToRemove = Utils.difference(this.nodeMap.getNodeIds(), new Set(this.root.getDescendants(true).map(d => d.id)));
        console.log(idsToRemove);
        // console.log(this.getNode(Array.from(idsToRemove)[0]).name);
    }

    getNode(id) {
        return this.proxyNodes.get(id);
    }

    addNode(node) {
        return this.nodeMap.addNode(node);
    }

    deleteNode(id) {
        this.proxyNodes.delete(id);
        this.nodeMap.deleteNode(id);
    }

    deleteNodes(ids) {
        for (let id of ids) this.deleteNode(id);
    }

    createRefProxyNode(id) {
    }

    createProxyNode(id, parentId) {
        console.assert(!this.proxyNodes.has(id));
        console.assert(!parentId || this.proxyNodes.get(parentId),
            `Cannot create proxy child: there is no proxy node for the parent (id ${parentId})`);

        const proxyNode = ProxyNode.createProxyNode(this, id, parentId);
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