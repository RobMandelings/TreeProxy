import * as Utils from "@pt/proxy_utils/Utils.js";
import {RefStore} from "@pt/ref_store/RefStore.js";
import {computed, reactive, ref} from "vue";
import {OverlayType} from "@pt/ref_store/overlay/OverlayType.js";
import {CoreNode} from "@pt/nodes/CoreNode.js";
import {
    applyChanges,
    deepDelete,
    deepEqual,
    deepGet,
    deepSet
} from "@pt/utils/deepObjectUtil.js";
import {ChangeUnit, deepGetChangesToApply, setChange, wrapInChangeUnitIfRequired} from "@pt/ref_store/overlay/ChangeUnit.js";
import {createNodeRef} from "@pt/ref_store/NodeRef.js";

function useOverlayNode(nodeChanges, srcNodeMap, rId) {

    let prevChanges = {};
    let srcNodeChanged = false;
    let initial = true;
    const rSrcNode = computed(() => {
        if (initial) initial = false;
        else srcNodeChanged = true;
        const srcNode = srcNodeMap.getElement(rId.value);

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
            changesToApply = deepGetChangesToApply(prevChanges, curChanges, srcNode);
        }

        const deep = deepGetChangesToApply(prevChanges, curChanges, srcNode);

        if (copy && Object.keys(changesToApply).length) applyChanges(copy, changesToApply);
        prevChanges = {...curChanges};

        if (copy && Object.keys(curChanges).length) return copy; // For consistency we only return the overwritten node if it actually has to be overwritten
        else return null; // If the copy is identical to the src node or if there is no copy
    });

    return {rCopy};

}

/**
 * Goal of the overlay ref store is to provide a mapping between the id and a node object. Whether or not the node object
 * is an (adjusted) copy of the original node or whether it simply refers to the original node is abstracted.
 */
export class OverlayRefStore extends RefStore {

    constructor(srcElementMap) {
        super();
        this.srcElementMap = srcElementMap;

        // Tracks the changes of the nodes on previous layer by keeping an object with the new property values
        this.elementChanges = new Map();
        // To treat the values as reactive objects, we make overlayNodes reactive.
        this.overlayElements = reactive({}); // We will add computed properties to this object.

        this.addedElements = new Map();
        this.elementNodeIds = new Set(); // Node ids which are deleted from the src map
    }

    getOverlayType(id) {
        if (this.addedElements.has(id)) return OverlayType.ADDED;
        else if (this.isOverwritten(id)) return OverlayType.OVERWRITTEN;
        else return OverlayType.SRC;
    }

    isDirty(id) {
        return this.elementChanges.has(id);
    }

    isPropDirty(id, prop) {
        if (!this.elementChanges.has(id)) return false;
        return this.elementChanges.get(id)[prop] !== undefined;
    }

    getPropertyValue(id, prop) {
        if (!this.isPropDirty(id, prop)) return this.srcElementMap.getPropertyValue(id, prop);
        return deepGet(this.elementChanges.get(id), prop);
    }

    createNodeRef(id) {
        const rId = ref(id);

        let rNode;

        // We don't need to a copy of the previous layer as the element was added on this layer.
        // Any adjustments directly apply to the element on this layer
        if (this.addedElements.has(id)) rNode = computed(() => this.addedElements.get(id));
        else {
            const {rCopy} = useOverlayNode(this.elementChanges, this.srcElementMap, rId);
            rNode = computed(() => this.getElement(rId.value));
            this.overlayElements[rId.value] = rCopy;
        }

        return createNodeRef(this, rId, rNode);
    }

    isOverwritten(id) {
        return this.overlayElements[id] != null;
    }

    syncSrc() {
        // Copy the computed elements from the computed map to the src map.
        // Old elements will be overwritten with their new values
        // this.changedNodes.forEach((v, k) => this.srcElementMap.nodes.set(k, v));
        // this.changedNodes.clear();
    }

    _addElement(node) {
        const id = CoreNode.generateId();
        this.addedElements.set(id, node);
        return id;
    }

    setNode(nodeId, node) {
        throw new Error("Not implemented");
    }

    set(nodeId, prop, val) {

        // TODO we did not yet check for object equalities (only primitives)
        const remove = deepEqual(this.srcElementMap.getPropertyValue(nodeId, prop), val);

        // If the node was added on this layer, any adjustments to this node simply apply to the node itself
        if (this.addedElements.has(nodeId)) setChange(this.addedElements.get(nodeId), prop, val);
        else {
            if (remove) {
                if (this.elementChanges.has(nodeId)) {
                    const changes = this.elementChanges.get(nodeId);
                    deepDelete(changes, prop);
                    if (Utils.isEmpty(changes))
                        this.elementChanges.delete(nodeId);
                }
            } else {

                // Sets the property to a value which will be applied to create new nodes
                if (!this.elementChanges.has(nodeId)) {
                    if (!this.srcElementMap.elementExists(nodeId)) throw new Error("Cannot make adjustments: " +
                        "Node does not exist in the src node map as well as the computed node map.");
                    this.elementChanges.set(nodeId, {});
                }
                setChange(this.elementChanges.get(nodeId), prop, val);
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

        this.elementChanges.clear();
        this.addedElements.clear();
        this.elementNodeIds.clear();
    }

    deleteElement(id) {
        this.elementNodeIds.add(id);
    }

    isDeleted(id) {
        return this.getDeletedNodeIds().has(id);
    }

    getAddedNode(id) {
        return this.addedElements.get(id);
    }

    getDeletedNodeIds() {
        return this.elementNodeIds;
    }

    getAddedNodeIds() {
        return new Set(this.addedElements.keys());
    }

    getElementIds() {
        let set = this.srcElementMap.getElementIds();
        set = set.union(this.getAddedNodeIds());
        set = Utils.difference(set, this.getDeletedNodeIds());
        return set;
    }

    getElement(id) {
        if (this.isDeleted(id)) return null;

        return this.getAddedNode(id)
            ?? this.overlayElements[id]
            ?? this.srcElementMap.getElement(id);
    }
}