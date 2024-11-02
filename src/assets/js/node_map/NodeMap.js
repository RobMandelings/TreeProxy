import {CustomNode} from "../CustomNode.js";
import * as Utils from "../Utils.js";
import {createMutableReferenceProxy, createReferenceProxy} from "../proxy_tree/RefProxy.js";

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

    createRefNode(id) {
        return createReferenceProxy(this, id);
    }

    _deleteNode(id) {

    }

    _addNode(node) {
    }

    set(nodeId, prop, value) {
        throw new Error("Abstract method");
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

    getNodeIds() {

    }

    nodeExists(id) {
        return this.getNode(id) != null;
    }
}

