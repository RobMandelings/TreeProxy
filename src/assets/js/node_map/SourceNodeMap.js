import {NodeMap} from "./NodeMap.js";

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

    getNodeIds() {
        return new Set(this.nodes.keys());
    }
}