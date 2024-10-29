import {CustomNode} from "./CustomNode.js";

class NodeNotExistsError extends Error {
    constructor(id) {
        super(`Node ${id} doesn't exist`);
    }
}

export class NodeMap {
    constructor() {
    }

    generateId() {
        return crypto.randomUUID();
    }

    _deleteNode(id) {

    }

    _addNode(node) {
    }

    addNode(node) {
        if (node == null) throw new Error("Node is null");
        const id = this._addNode(node);
        console.assert(this.getNode(id));
        return id;
    }

    addTree(tree) {
        let childrenIds = (tree.children?.length) ? tree.children.map(c => this.addTree(c)) : [];
        return this.addNode(new CustomNode(tree.name, childrenIds));
    }

    deleteNode(id) {
        if (!this.getNode(id)) throw new NodeNotExistsError(id);
        this._deleteNode(id);
        console.assert(!this.getNode(id));
    }

    getNode(id) {
        throw new Error("Abstract method")
    }
}

export class SourceNodeMap extends NodeMap {

    constructor() {
        super();
        this.nodes = new Map();
    }

    _addNode(node) {
        const id = this.generateId();
        this.nodes.set(id, node);
        return id;
    }

    _deleteNode(id) {
        this.nodes.delete(id);
    }

    getNode(id) {
        return this.nodes.get(id);
    }
}

export class ComputedNodeMap extends NodeMap {

    constructor(srcNodeMap) {
        super();
        this.srcNodeMap = srcNodeMap;
        this.overwrittenNodes = new Map();
        this.addedNodes = new Map();
        this.deletedNodes = new Set();
    }

    overwriteNode(id, node) {
        console.assert(this.srcNodeMap.getNode(id), "Node not present in the src node map");
        this.overwrittenNodes.set(id, node);
    }

    _addNode(node) {
        const id = this.generateId();
        this.addedNodes.set(id, node);
        return id;
    }

    _deleteNode(id) {
        this.deletedNodes.add(id);
    }

    getDeletedNodes() {
        return this.deletedNodes;
    }

    getAddedNode(id) {
        return this.addedNodes.get(id);
    }

    getOverwrittenNode(id) {
        return this.overwrittenNodes.get(id);
    }

    getComputedNode(id) {
        return this.getAddedNode(id)
            ?? this.getOverwrittenNode(id)
    }

    getNode(id) {
        if (id in this.deletedNodes) throw new Error(`Node with id ${id} is deleted`);

        return this.getComputedNode(id)
            ?? this.srcNodeMap.getNode(id);
    }
}