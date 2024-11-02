import * as Utils from "../Utils.js";

class ChangeTracker {

    constructor(srcNodeMap) {
        this.srcNodeMap = srcNodeMap;
        this.changes = new Map();
    }

    set(nodeId, prop, val) {
        // Sets the property to a value which will be applied to create new nodes
    }

    get(nodeId, prop) {

    }

    clearPropertyChange(nodeId, prop) {

    }

    clearNodeChanges(nodeId) {

    }

    clearAllChanges() {

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
        this.deletedNodeIds.add(id);
    }

    getAddedNode(id) {
        return this.addedNodes.get(id);
    }

    getDeletedNodeIds() {
        return this.deletedNodeIds;
    }

    getOverwrittenNodeIds() {
        return new Set(this.overwrittenNodes.keys());
    }

    getAddedNodeIds() {
        return new Set(this.addedNodes.keys());
    }

    getOverwrittenNode(id) {
        return this.overwrittenNodes.get(id);
    }

    getNodeIds() {
        let set = this.srcNodeMap.getNodeIds();
        set = set.union(this.getAddedNodeIds());
        set = Utils.difference(set, this.getDeletedNodeIds());
        return set;
    }

    getComputedNode(id) {
        return this.getAddedNode(id)
            ?? this.getOverwrittenNode(id)
    }

    getNode(id) {
        if (id in this.deletedNodeIds) throw new Error(`Node with id ${id} is deleted`);

        return this.getComputedNode(id)
            ?? this.srcNodeMap.getNode(id);
    }
}