import * as Utils from "../Utils.js";
import {NodeMap} from "./NodeMap.js";
import {computed, reactive, ref} from "vue";
import * as RefProxy from "./RefProxy.js";

function applyChanges(node, changes) {
    Object.entries(changes).forEach(([key, value]) => {
        if (!node.hasOwnProperty(key)) throw new Error("Cannot apply changes: this node does not have ")
        node[key] = value;
    });
}

export class OverlayNodeMap extends NodeMap {

    constructor(srcNodeMap) {
        super();
        this.srcNodeMap = srcNodeMap;

        // Tracks the changes of the nodes on previous layer by keeping an object with the new property values
        this.nodeChanges = new Map();

        // Copies of the nodes that use the node changes
        this.changedNodes = new Map();

        this.addedNodes = new Map();
        this.deletedNodeIds = new Map(); // Node ids which are deleted from the src map
    }

    isDirty(id) {
    }

    isDirtyProp(id, prop) {
        super.isDirtyProp(id, prop);
    }

    createRefProxy(initialId) {
        const rId = ref(initialId);

        let copy, prevId;

        const rNode = computed(() => {
            const id = rId.value;
            // Only a copy is made on each recomputation. Still quite inexpensive as no deep copies are required.
            if (this.changedNodes.has(id)) {
                if (prevId !== id) copy = undefined; // Node reference id has changed. Old copy is invalid.
                if (!copy) copy = this.srcNodeMap.getNode(id).copy();
                applyChanges(copy, this.changedNodes[id]);
                return copy;
            } else {
                if (copy) copy = undefined;

                return this.getNode(rId.value)
            }
        });
        return RefProxy.createRefProxy(this, rId, rNode);
    }

    syncSrc() {
        // Copy the computed nodes from the computed map to the src map.
        // Old nodes will be overwritten with their new values
        this.changedNodes.forEach((v, k) => this.srcNodeMap.nodes.set(k, v));
        this.changedNodes.clear();
    }

    _addNode(node) {
        const id = this.generateId();
        this.changedNodes.set(id, node);
        return id;
    }

    setNode(nodeId, node) {
        throw new Error("Not implemented");
    }

    set(nodeId, prop, val) {

        // Sets the property to a value which will be applied to create new nodes
        if (!this.computedNodeExists(nodeId)) {
            if (!this.srcNodeMap.nodeExists(nodeId)) throw new Error("Cannot make adjustments: " +
                "Node does not exist in the src node map as well as the computed node map.")
            this.changedNodes.set(nodeId, this.srcNodeMap.getNode(nodeId).copy());
        }

        this.changedNodes.get(nodeId)[prop] = val;
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

    deleteNode(id) {
        this.deletedNodeIds.add(id);
        return 1;
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
        return this.changedNodes.get(id);
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