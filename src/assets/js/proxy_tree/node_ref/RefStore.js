import {CustomNode} from "@pt/nodes/CustomNode.js";

class NodeNotExistsError extends Error {
    constructor(id) {
        super(`Node ${id} doesn't exist`);
    }
}

/**
 * The purpose of the ref store is to maintain references to objects via their id.
 * And to provide a centralised way of setting node properties and getting nodes. This allows for abstracting complexity,
 * such as when a copy needs to be made when a property of an object has changed.
 */
export class RefStore {
    constructor() {
    }

    getOverlayType(id) {
        throw new Error("Abstract method");
    }

    isDirty(id) {
        throw new Error('Abstract method');
    }

    isPropDirty(id, prop) {
        throw new Error('Abstract method');
    }

    getPropertyValue(id, prop) {
        throw new Error("Abstract method");
    }

    createNodeRef(initialId) {
        throw new Error("Abstract method");
    }

    _addElement(node) {
    }

    set(nodeId, prop, value) {
        throw new Error("Abstract method");
    }

    addElement(el) {
        if (el == null) throw new Error("Element is null");
        const id = this._addElement(el);
        console.assert(this.getElement(id));
        return id;
    }

    replaceElement(id, node) {
        throw new Error("Abstract method");
    }

    deleteElement(id) {
        throw new Error("Abstract method");
    }

    getElement(id) {
        throw new Error("Abstract method")
    }

    getElementIds() {

    }

    elementExists(id) {
        return !!this.getElement(id);
    }
}

