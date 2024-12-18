import {RefStore} from "@pt/node_ref/RefStore.js";
import {computed, ref} from "vue";
import {OverlayType} from "@pt/node_ref/overlay/OverlayType.js";
import {CoreNode} from "@pt/nodes/CoreNode.js";
import {deepGet, deepSet} from "@pt/utils/deepObjectUtil.js";
import {createNodeRef} from "@pt/node_ref/NodeRef.js";

export class SrcRefStore extends RefStore {

    constructor(nodeMap) {
        super();
        this.elements = nodeMap;
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
        return deepGet(n, prop);
    }

    createNodeRef(initialId) {
        const rId = ref(initialId);
        const rNode = computed(() => this.getElement(rId.value));
        return createNodeRef(this, rId, rNode);
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
        deepSet(this.getElement(nodeId), prop, value);
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