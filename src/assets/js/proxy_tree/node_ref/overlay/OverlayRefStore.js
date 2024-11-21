import * as Utils from "@pt/utils/util.js";
import {RefStore} from "@pt/node_ref/RefStore.js";
import {computed, reactive, ref} from "vue";
import {OverlayType} from "@pt/node_ref/overlay/OverlayType.js";
import {CoreNode} from "@pt/nodes/CoreNode.js";
import {
    applyChanges,
    deepDelete,
    deepEqual,
    deepGet,
    deepSet
} from "@pt/utils/deepObjectUtil.js";
import {
    ChangeUnit,
    deepGetChangesToApply,
    setChange,
    wrapInChangeUnitIfRequired
} from "@pt/node_ref/overlay/ChangeUnit.js";
import {createNodeRef} from "@pt/node_ref/NodeRef.js";
import {useNodeCopy} from "@pt/node_ref/overlay/useNodeCopy.js";


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
            const {rCopy} = useNodeCopy(this.elementChanges, this.srcElementMap, rId);
            rNode = computed(() => this.getElement(rId.value));
            this.overlayElements[rId.value] = rCopy;
        }

        return createNodeRef(this, rId, rNode);
    }

    isOverwritten(id) {
        return this.overlayElements[id] != null;
    }

    /**
     * Synchronise all changes with the source ref store.
     */
    syncSrc() {
    }

    _addElement(node) {
        const id = CoreNode.generateId();
        this.addedElements.set(id, node);
        return id;
    }

    setNode(nodeId, node) {
        throw new Error("Not implemented");
    }

    /**
     * Sets the property value of a node with id nodeId. In the overlayNodeMap,
     * the change is not directly applied to the node, but the changes are kept in the elementChanges variable.
     * Then we can use the elementChanges variable to apply the changes to a copy of the source node such that it has
     * the correct values (see useOverlayNode)
     * @param nodeId
     * @param prop
     * @param val
     */
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