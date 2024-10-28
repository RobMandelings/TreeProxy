class NodeMap {
    constructor() {
    }

    generateId() {
        return crypto.randomUUID();
    }

    addNode(node) {
        throw new Error("Abstract method")
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

    addNode(node) {
        const id = this.generateId();
        this.nodes.set(id, node);
        return id;
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

    addNode(node) {
        const id = this.generateId();
        this.addedNodes.set(id, node);
        return id;
    }

    overwriteNode(id, node) {
        console.assert(this.srcNodeMap.getNode(id), "Cannot set overwritten node: node not present in the src node map");
        this.overwrittenNodes.set(id, node);
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