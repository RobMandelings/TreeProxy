import {NodeMap} from "@pt/node_map/NodeMap.js";
import {computed, ref} from "vue";
import * as RefProxy from "@pt/node_map/RefProxy.js"
import {OverlayType} from "@pt/OverlayType.js";
import {CoreNode} from "@pt/CoreNode.js";

export class SourceNodeMap extends NodeMap {

    constructor() {
        super();
        this.nodes = new Map();
    }

    getOverlayType(id) {
        return OverlayType.SRC;
    }

    isDirty(id) {
        return false;
    }

    isPropDirty(id, prop) {
        return false;
    }

    getPropertyValue(id, prop) {
        if (!this.getNode(id)) return undefined;
        const n = this.getNode(id);
        return n[prop];
    }

    createRefProxy(initialId) {
        const rId = ref(initialId);
        const rNode = computed(() => this.getNode(rId.value));
        return RefProxy.createRefProxy(this, rId, rNode);
    }

    _addNode(node) {
        const id = CoreNode.generateId();
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