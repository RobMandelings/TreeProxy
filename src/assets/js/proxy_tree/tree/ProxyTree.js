import {RefStore} from "@pt/node_map/RefStore.js";
import {NodeNotFoundError, RootNotSetError} from "@pt/tree/ProxyTreeErrors.js";
import {IncorrectIndexError, UndefinedIndexError} from "@pt/proxy_node/ProxyNodeErrors.js";
import {SIMPLE_PROXY_NODE_FACTORY} from "@pt/proxy_node/ProxyNodeFactory.js";

export class ProxyTree extends RefStore {

    constructor(elementRegistry, proxyNodeFactory) {
        super();
        this.proxyNodeFactory = proxyNodeFactory;
        this.nodeMap = elementRegistry; // TODO make the node map immutable when returned
        this.proxyNodes = new Map();
        this.computedTreeOverlays = [];
        this._root = null;
    }

    getOverlayType(id) {
        return this.nodeMap.getOverlayType(id);
    }

    getSrcNode(id) {
        throw new Error("Abstract method");
    }

    isDirty(id) {
        return this.nodeMap.isDirty(id);
    }

    isPropDirty(id, prop) {
        return this.nodeMap.isPropDirty(id, prop);
    }

    markOverlaysDirty() {
        this.computedTreeOverlays.forEach(t => t.markDirty());
    }

    addComputedTreeOverlay(tree) {
        this.computedTreeOverlays.push(tree);
    }

    init(rootId) {
        if (this._root) this._root.delete();
        this.initRootId(rootId);
        this.initProxyNodes();
        return this;
    }

    /**
     * Initialises the map of proxy nodes such that they are loaded eagerly
     * Takes up more memory usage and increases initial loading times, but better for reactivity.
     * TODO test performance on large tree structures.
     */
    initProxyNodes() {
        // All proxy nodes will be initialised by simply retrieving the descendants of the root
        this.root.descendants.asArray;
    }

    initRootId(rootId) {
        if (!this.nodeMap.elementExists(rootId))
            throw new Error("Cannot set root: the node does not exist in the node map");
        this._root = this.createProxyNode(rootId, null);
        return this;
    }

    get root() {
        if (!this._root) throw new RootNotSetError();
        return this._root;
    }

    getElement(id) {
        return this.proxyNodes.get(id);
    }

    addElement(node) {
        return this.nodeMap.addElement(node);
    }

    replaceElement(id, node) {
        throw new Error("Node replacement is not yet implemented for computed trees either");
        const prevNode = this.getElement(id);
        if (!prevNode) throw new Error(`Can't replace node: node with id ${id} does not exist in this proxy tree`);
        // Delete all children. TODO: replacement involving trees. Allow for nested nodes to remain if position in tree is the same.
        prevNode.children.asArray.map(c => c.delete());
        this.nodeMap.replaceNode(id, node);
    }

    addChild(parentId, node, index) {
        if (index == null) throw new UndefinedIndexError();
        if (isNaN(index)) throw new IncorrectIndexError(index);
        if (typeof index === "string") index = parseInt(index);

        const parent = this.getElement(parentId);
        if (!parent) throw new Error("Cannot add child: parent not found");
        const id = this.nodeMap.addElement(node);

        // Apparently splice with -1 index
        // does not insert at the last position, we have to use array.length.
        if (index === -1) index = parent.childrenIds.length;
        // Create a new array using assignment instead of splice
        parent.childrenIds = [
            ...parent.childrenIds.slice(0, index),
            id,
            ...parent.childrenIds.slice(index)
        ];
        return id;
    }

    deleteElement(id) {
        const node = this.proxyNodes.get(id);
        if (node.parent) {
            const newChildrenIds = node.parent.childrenIds.filter(cId => cId !== id);
            node.parent.childrenIds = newChildrenIds; // Removing child from parent
        }
        const nrDeleted = node.children.asArray.reduce((acc, c) => acc + c.delete(), 1);

        this.proxyNodes.delete(id);
        this.nodeMap.deleteElement(id);

        return nrDeleted;
    }

    deleteElements(ids) {
        for (let id of ids) this.deleteElement(id);
    }

    createProxyNode(id, parentId) {
        console.assert(!this.proxyNodes.has(id));

        const proxyNode = this.createProxyNodeFn(id, parentId);
        this.proxyNodes.set(id, proxyNode);
        return proxyNode;
    }

    createProxyNodeFn() {
        throw new Error("Abstract method");
    }

    getChildren(id) {
        const node = this.nodeMap.getElement(id);
        if (!node) {
            throw new NodeNotFoundError(id);
        }

        return node.childrenIds.map(cId => {
            return this.proxyNodes.get(cId)
                ?? this.createProxyNode(cId, id);
        });
    }

    moveTo(nodeId, parentId) {
        const node = this.getElement(nodeId);
        const parent = this.getElement(parentId);
        if (!node) throw new Error("Can't move node to parent: node does not exist");
        if (!parent) throw new Error("Can't move node to parent: parent does not exist");

        node.parent.childrenIds = node.parent.childrenIds.filter(cId => cId !== node.id);
        parent.childrenIds = [...parent.childrenIds, nodeId];
        // TODO make childrenIds only accessible internally (proxy tree)
        // TODO don't allow methods to be executed upon childrenIds, these do not work well with computed trees.
    }

    movePos(nodeId, pos) {
        const node = this.getElement(nodeId);
        const parent = node.parent;
        if (!node) throw new Error("Can't move pos: node does not exist");

        if (!parent) return; // Position can't change as it has no siblings

        // Clamp to valid positions
        if (pos < 0) pos = 0;
        if (pos > parent.childrenIds.length - 1) pos = parent.childrenIds.length - 1;

        const childrenIds = parent.childrenIds.filter(cId => cId !== nodeId);

        childrenIds.splice(pos, 0, nodeId);
        parent.childrenIds = childrenIds;
    }
}