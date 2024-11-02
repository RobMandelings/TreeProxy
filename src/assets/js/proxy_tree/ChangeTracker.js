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

}