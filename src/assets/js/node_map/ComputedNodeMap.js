import * as Utils from "../Utils.js";
import {NodeMap} from "./NodeMap.js";

export class ComputedNodeMap extends NodeMap {

    constructor(srcNodeMap) {
        super();
        this.srcNodeMap = srcNodeMap;
        this.computedNodes = new Map();
        this.deletedNodeIds = new Map(); // Node ids which are deleted from the src map
    }

    syncSrc() {
        // Copy the computed nodes from the computed map to the src map.
        // Old nodes will be overwritten with their new values
        this.computedNodes.forEach((v, k) => this.srcNodeMap.nodes.set(k, v));
        this.computedNodes.clear();
    }

    setNode(nodeId, node) {
        this.computedNodes[nodeId] = node;
    }

    set(nodeId, prop, val) {
        // Sets the property to a value which will be applied to create new nodes
        if (!this.computedNodeExists(nodeId)) {
            if (!this.srcNodeMap.nodeExists(nodeId)) throw new Error("Cannot make adjustments: " +
                "Node does not exist in the src node map as well as the computed node map.")
            this.computedNodes[nodeId] = this.srcNodeMap.getNode(nodeId).copy();
        }

        this.computedNodes[nodeId][prop] = val;
    }

    get(nodeId, prop) {

    }

    _deleteNode(nodeId) {

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

    isDeleted(id) {
        return this.getDeletedNodeIds().has(id);
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
        return this.computedNodes.get(id);
    }

    computedNodeExists(id) {
        return this.getComputedNode(id);
    }

    getNode(id) {
        if (this.isDeleted(id)) return null;

        return this.getComputedNode(id)
            ?? this.srcNodeMap.getNode(id);
    }
}