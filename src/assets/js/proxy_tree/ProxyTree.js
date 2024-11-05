import {NodeMap} from "../node_map/NodeMap.js";
import * as ProxyNode from "../proxy_tree/ProxyNode.js"
import {NodeNotFoundError, RootNotSetError} from "./ProxyTreeErrors.js";

export class ProxyTree extends NodeMap {

    constructor(nodeMap) {
        super();
        this.nodeMap = nodeMap; // TODO make the node map immutable when returned
        this.proxyNodes = new Map();
        this._root = null;
    }

    init(tree) {
        if (this._root) this._root.delete();
        const rootId = this.addTree(tree);
        this.initRootId(rootId);
        return this;
    }

    initRootId(rootId) {
        if (!this.nodeMap.nodeExists(rootId))
            throw new Error("Cannot set root: the node does not exist in the node map");
        this._root = this.createProxyNode(rootId, null);
        return this;
    }

    get root() {
        if (!this._root) throw new RootNotSetError();
        return this._root;
    }

    getNode(id) {
        return this.proxyNodes.get(id);
    }

    addNode(node) {
        return this.nodeMap.addNode(node);
    }

    deleteNode(id) {
        const node = this.proxyNodes.get(id);
        if (node.parent) {
            const newChildrenIds = node.parent.childrenIds.filter(cId => cId !== id);
            node.parent.childrenIds = newChildrenIds; // Removing child from parent
        }
        const nrDeleted = node.children.asArray.reduce((acc, c) => acc + c.delete(), 1);

        this.proxyNodes.delete(id);
        this.nodeMap.deleteNode(id);

        return nrDeleted;
    }

    deleteNodes(ids) {
        for (let id of ids) this.deleteNode(id);
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
        const node = this.nodeMap.getNode(id);
        if (!node) throw new NodeNotFoundError(id);

        return node.childrenIds.map(cId => {
            return this.proxyNodes.get(cId)
                ?? this.createProxyNode(cId, id);
        });
    }

    moveTo(nodeId, parentId) {
        const node = this.getNode(nodeId);
        const parent = this.getNode(parentId);
        if (!node) throw new Error("Can't move node to parent: node does not exist");
        if (!parent) throw new Error("Can't move node to parent: parent does not exist");

        node.parent.childrenIds = parent.childrenIds.filter(cId => cId !== node.id);
        parent.childrenIds.push(nodeId);

    }
}