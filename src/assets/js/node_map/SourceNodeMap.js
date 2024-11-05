import {NodeMap} from "./NodeMap.js";

export class SourceNodeMap extends NodeMap {

    constructor() {
        super();
        this.nodes = new Map();
    }

    isDirty(id) {
        return false;
    }

    _addNode(node) {
        const id = this.generateId();
        this.nodes.set(id, node);
        return id;
    }

    replaceNode(id, node) {
        this.nodes.set(id, node);
    }

    set(nodeId, prop, value) {
        if (!this.nodeExists(nodeId)) throw new Error("Cannot set node property: node does not exist");
        this.getNode(nodeId)[prop] = value;
    }

    deleteNode(id) {
        this.nodes.delete(id);
    }

    getNode(id) {
        return this.nodes.get(id);
    }

    getNodeIds() {
        return new Set(this.nodes.keys());
    }
}