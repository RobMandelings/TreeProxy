import * as Utils from "../Utils.js";
import {NodeMap} from "./NodeMap.js";
import {computed, reactive, ref, toRaw, watch, watchSyncEffect} from "vue";
import * as RefProxy from "./RefProxy.js";
import {equalKeys, isEmpty} from "../Utils.js";

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

    let srcNodeChanged = false;
    const rSrcNode = computed(() => {
        srcNodeChanged = true;
        const srcNode = srcNodeMap.getNode(rId.value);

        // This one is essential to make the computed prop reactive on deep changes
        // It seems like it does nothing, but this makes sure that the computed prop is recalled whenever any of the properties in the srcNode changes
        // E.g. name change, weight change, or anything else. This will indirectly invalidate the copy of the overlay node.
        Object.values(srcNode);
        return srcNode;
    });

    let count = 0;
    let copy;

    let prevChanges = {};
    const rNodeChanges = computed(() => nodeChanges.get(rId.value) ?? {});

    const rCopy = computed(() => {

        const srcNode = rSrcNode.value;
        const curChanges = rNodeChanges.value;
        let changesToApply = getChangesToApply(prevChanges, curChanges, srcNode);
        console.log(isEmpty(changesToApply));
        if (srcNodeChanged && !isEmpty(changesToApply)) { // In this case we need to create a new copy and apply all changes again
            copy = reactive(srcNode.copy());
            srcNodeChanged = false;
        }

        // The copy is reactive, and we don't want to trigger unnecessary recomputations here (or circular dependencies)
        if (Object.keys(changesToApply).length) {
            console.log(`Changes to apply: ${JSON.stringify(prevChanges)} ${JSON.stringify(curChanges)} ${JSON.stringify(changesToApply)}`);
            console.log(`Overlay node recompute: ${count++}`);
            applyChanges(copy, changesToApply);
        }
        prevChanges = curChanges;

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
        this.overlayNodes = new Map();

        this.addedNodes = new Map();
        this.deletedNodeIds = new Set(); // Node ids which are deleted from the src map
    }

    isDirty(id) {
        return this.nodeChanges.has(id);
    }

    isDirtyProp(id, prop) {
        if (!this.nodeChanges.has(id)) return false;
        return this.nodeChanges.get(id)[prop] !== undefined;
    }

    getPropertyValue(id, prop) {
        if (!this.isDirtyProp(id, prop)) return this.srcNodeMap.getPropertyValue(id, prop);
        return this.nodeChanges.get(id)[prop];
    }

    createRefProxy(initialId) {
        const rId = ref(initialId);
        const {rCopy} = useOverlayNode(this.nodeChanges, this.srcNodeMap, rId);

        let count = 0;
        const rNode = computed(() => {
            return rCopy.value
                ?? this.getNode(rId.value)
        });
        this.overlayNodes.set(rId.value, rNode);

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
            ?? this.srcNodeMap.getNode(id);
    }
}