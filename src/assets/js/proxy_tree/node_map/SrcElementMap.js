import {ElementMap} from "@pt/node_map/ElementMap.js";
import {computed, ref} from "vue";
import * as RefProxy from "@pt/node_map/RefProxy.js"
import {OverlayType} from "@pt/OverlayType.js";
import {CoreNode} from "@pt/CoreNode.js";

export class SrcElementMap extends ElementMap {

    constructor() {
        super();
        this.elements = new Map();
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
        if (!this.getElement(id)) return undefined;
        const n = this.getElement(id);
        return n[prop];
    }

    createRefProxy(initialId) {
        const rId = ref(initialId);
        const rNode = computed(() => this.getElement(rId.value));
        return RefProxy.createRefProxy(this, rId, rNode);
    }

    _addElement(node) {
        const id = CoreNode.generateId();
        this.elements.set(id, node);
        return id;
    }

    replaceElement(id, node) {
        this.elements.set(id, node);
    }

    set(nodeId, prop, value) {
        if (!this.elementExists(nodeId)) throw new Error("Cannot set node property: node does not exist");
        this.getElement(nodeId)[prop] = value;
    }

    deleteElement(id) {
        this.elements.delete(id);
    }

    getElement(id) {
        return this.elements.get(id);
    }

    getElementIds() {
        return new Set(this.elements.keys());
    }
}