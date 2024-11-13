import * as Utils from "../Utils.js";
import {NodeMap} from "./NodeMap.js";
import {computed, reactive, ref, toRaw, watch, watchSyncEffect} from "vue";
import * as RefProxy from "./RefProxy.js";
import {equalKeys, isEmpty} from "../Utils.js";
import {OverlayType} from "../proxy_tree/OverlayType.js";

function applyChanges(node, changes) {
    Object.entries(changes).forEach(([key, value]) => {
        if (!node.hasOwnProperty(key)) throw new Error("Cannot apply changes: this node does not have ")
        node[key] = value;
    });
}

function getChangesToApply(prevChanges, curChanges, srcNode) {
    const changesToApply = {...curChanges};
    for (const key in prevChanges) {
        if (!(key in curChanges)) {
            changesToApply[key] = srcNode[key]; // Restore if the change is removed
        }
    }

    for (const key in curChanges) {
        if (key in prevChanges && prevChanges[key] === curChanges[key])
            delete changesToApply[key];
    }

    return changesToApply;
}

function useOverlayNode(nodeChanges, srcNodeMap, rId) {

    let prevChanges = {};
    let srcNodeChanged = false;
    let initial = true;
    const rSrcNode = computed(() => {
        if (initial) initial = false;
        else srcNodeChanged = true;
        const srcNode = srcNodeMap.getNode(rId.value);

        // This one is essential to make the computed prop reactive on deep changes
        // It seems like it does nothing, but this makes sure that the computed prop is recalled whenever any of the properties in the srcNode changes
        // E.g. name change, weight change, or anything else. This will indirectly invalidate the copy of the overlay node.
        Object.values(srcNode);
        return srcNode;
    });

    let copy;
    const rNodeChanges = computed(() => nodeChanges.get(rId.value) ?? {});

    // TODO future optimisation: when the srcNode originates from another computed layer,
    // instead of copying the entire node again we can simply get the changes from the previous layer and apply them recursively.
    // E.g. via function getTotalChanges() or something. Then we only have to copy once and then use that copy
    const rCopy = computed(() => {

        const srcNode = rSrcNode.value;
        const curChanges = rNodeChanges.value;
        let changesToApply;
        if (srcNodeChanged || (!copy && Object.keys(curChanges).length)) { // In this case we need to create a new copy and apply all changes again
            copy = reactive(srcNode.copy());
            changesToApply = curChanges; // Don't use prevChanges as it is a new copy
            srcNodeChanged = false;
        } else {
            // Compute the changes that should be applied based on current and prev changes.
            changesToApply = getChangesToApply(prevChanges, curChanges, srcNode);
        }

        if (copy && Object.keys(changesToApply).length) applyChanges(copy, changesToApply);
        prevChanges = {...curChanges};

        return copy;
    });

    return {rCopy};

}

export class OverlayNodeMap extends NodeMap {

    constructor(srcNodeMap) {
        super();
        this.srcNodeMap = srcNodeMap;

        // Tracks the changes of the nodes on previous layer by keeping an object with the new property values
        this.nodeChanges = new Map();
        // To treat the values as reactive objects, we make overlayNodes reactive.
        this.overlayNodes = reactive({}); // We will add computed properties to this object.

        this.addedNodes = new Map();
        this.deletedNodeIds = new Set(); // Node ids which are deleted from the src map
    }

    getOverlayType(id) {
        if (this.addedNodes.has(id)) return OverlayType.ADDED;
        else if (id in this.overlayNodes) return OverlayType.OVERWRITTEN;
        else return OverlayType.SRC;
    }

    isDirty(id) {
        return this.nodeChanges.has(id);
    }

    isPropDirty(id, prop) {
        if (!this.nodeChanges.has(id)) return false;
        return this.nodeChanges.get(id)[prop] !== undefined;
    }

    getPropertyValue(id, prop) {
        if (!this.isPropDirty(id, prop)) return this.srcNodeMap.getPropertyValue(id, prop);
        return this.nodeChanges.get(id)[prop];
    }

    createRefProxy(id) {
        const rId = ref(id);

        let rNode;

        // We don't need to a copy of the previous layer as the node was added on this layer.
        // Any adjustments directly apply to the node on this layer
        if (this.addedNodes.has(id)) rNode = computed(() => this.addedNodes.get(id));
        else {
            const {rCopy} = useOverlayNode(this.nodeChanges, this.srcNodeMap, rId);

            rNode = computed(() => {
                return rCopy.value
                    ?? this.getNode(rId.value)
            });

            this.overlayNodes[rId.value] = rNode;
        }

        return RefProxy.createRefProxy(this, rId, rNode);
    }

    syncSrc() {
        // Copy the computed nodes from the computed map to the src map.
        // Old nodes will be overwritten with their new values
        // this.changedNodes.forEach((v, k) => this.srcNodeMap.nodes.set(k, v));
        // this.changedNodes.clear();
    }

    _addNode(node) {
        const id = this.generateId();
        this.addedNodes.set(id, node);
        return id;
    }

    setNode(nodeId, node) {
        throw new Error("Not implemented");
    }

    set(nodeId, prop, val) {

        // TODO we did not yet check for object equalities (only primitives)
        const remove = (this.srcNodeMap.getPropertyValue(nodeId, prop) === val);

        // If the node was added on this layer, any adjustments to this node simply apply to the node itself
        if (this.addedNodes.has(nodeId)) this.addedNodes.get(nodeId)[prop] = val;
        else {
            if (remove) {
                if (this.nodeChanges.has(nodeId)) {
                    const changes = this.nodeChanges.get(nodeId);
                    if (Object.hasOwn(changes, prop)) {
                        delete this.nodeChanges.get(nodeId)[prop];
                        if (Utils.isEmpty(changes))
                            this.nodeChanges.delete(nodeId);
                    }
                }
            } else {

                // Sets the property to a value which will be applied to create new nodes
                if (!this.nodeChanges.has(nodeId)) {
                    if (!this.srcNodeMap.nodeExists(nodeId)) throw new Error("Cannot make adjustments: " +
                        "Node does not exist in the src node map as well as the computed node map.");
                    this.nodeChanges.set(nodeId, {});
                }
                this.nodeChanges.get(nodeId)[prop] = val;
            }
        }
    }

    get(nodeId, prop) {

    }

    clearPropertyChange(nodeId, prop) {

    }

    clearNodeChanges(nodeId) {

    }

    clearAllChanges() {

        this.nodeChanges.clear();
        this.addedNodes.clear();
        this.deletedNodeIds.clear();
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

    getAddedNodeIds() {
        return new Set(this.addedNodes.keys());
    }

    getNodeIds() {
        let set = this.srcNodeMap.getNodeIds();
        set = set.union(this.getAddedNodeIds());
        set = Utils.difference(set, this.getDeletedNodeIds());
        return set;
    }

    getNode(id) {
        if (this.isDeleted(id)) return null;

        return this.getAddedNode(id)
            ?? this.overlayNodes[id]
            ?? this.srcNodeMap.getNode(id);
    }
}