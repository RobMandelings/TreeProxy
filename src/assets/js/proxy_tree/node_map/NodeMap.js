import {CustomNode} from "../../CustomNode.js";
import {createRefProxy} from "./RefProxy.js";
import {computed, ref} from "vue";

class NodeNotExistsError extends Error {
    constructor(id) {
        super(`Node ${id} doesn't exist`);
    }
}

export class NodeMap {
    constructor() {
    }

    getOverlayType(id) {
        throw new Error("Abstract method");
    }

    isDirty(id) {
        throw new Error('Abstract method');
    }

    isPropDirty(id, prop) {
        throw new Error('Abstract method');
    }

    getPropertyValue(id, prop) {
        throw new Error("Abstract method");
    }

    generateId() {
        return crypto.randomUUID();
    }

    createRefProxy(initialId) {
        throw new Error("Abstract method");
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

    replaceNode(id, node) {
        throw new Error("Abstract method");
    }

    addTree(tree) {
        let childrenIds = (tree.children?.length) ? tree.children.map(c => this.addTree(c)) : [];
        return this.addNode(new CustomNode(tree.name, tree.weight, childrenIds));
    }

    deleteNode(id) {
        throw new Error("Abstract method");
    }

    getNode(id) {
        throw new Error("Abstract method")
    }

    getNodeIds() {

    }

    nodeExists(id) {
        return !!this.getNode(id);
    }
}

