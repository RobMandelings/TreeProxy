export class NodeMap {
    constructor() {
        this.nodes = new Map();
    }

    addNode(node) {
        this.nodes.set(node.id, node);
    }

    getNode(id) {
        return this.nodes.get(id);
    }
}

export class ComputedNodeMap extends NodeMap {

    constructor(srcNodeMap) {
        super();
        this.srcNodeMap = srcNodeMap;
    }

    getNode(id) {
        const node = this.getComputedNode(id);
        if (!node) return this.srcNodeMap.getNode(id);
        return node;
    }

    getComputedNode(id) {
        return super.getNode(id);
    }
}