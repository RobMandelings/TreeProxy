import {computed, reactive} from "vue";
import {deepGetChangesToApply} from "@pt/ref_store/overlay/ChangeUnit.js";
import {applyChanges} from "@pt/utils/deepObjectUtil.js";
import {computedEffect, useDepTracking} from "@pt/utils/useDepTracking.js";
import {isEmpty} from "@pt/proxy_utils/Utils.js";

/**
 * Creates a computed property that represents the copied source node (with applied changes).
 */
export function useNodeCopy(nodeChanges, srcNodeMap, rId) {

    /**
     * Tracks changes on the srcNode. This is required as we need to invalidate the copy when any of the dependencies
     * of the source node change.
     *
     * TODO: currently, the source node
     */
    const rDepTracker = computed(() => useDepTracking([() => Object.values(rSrcNode.value)]));
    const rSrcNodeChanged = computed(() => rDepTracker.value.hasDirtyDeps());
    const rSrcNode = computed(() => srcNodeMap.getElement(rId.value));

    const rNodeChanges = computed(() => nodeChanges.get(rId.value) ?? {});

    /**
     * Reference to the current copy of the source node. rCopy returns this value after applying changes to it
     * From an outside observer, the computed rCopy does not make any side effects (as is expected), but internally
     * Some side effects are triggered to make it more efficient.
     */
    let copy;
    let prevChanges = {}; // Changes that were already applied to the copy

    const shouldMakeNewCopy = () => {
        if (rSrcNodeChanged.value) return true;  // If the source node has changed in any way, we need to invalidate the current copy
        else if (!copy && !isEmpty(rNodeChanges.value)) return true; // There is no copy but we should apply changes to the source node
        return false;
    }

    const updateCopy = () => {
        const srcNode = rSrcNode.value;
        const curChanges = rNodeChanges.value;
        let changesToApply;

        if (shouldMakeNewCopy()) // In this case we need to create a new copy and apply all changes again
         {
            copy = reactive(srcNode.copy());
            changesToApply = curChanges; // It is a fresh copy, so we need to apply all changes that were tracked to this new copy
            rDepTracker.value.resetDirtyDeps();
        } else {
            // Compute the changes that should be applied based on current and prev changes.
            changesToApply = deepGetChangesToApply(prevChanges, curChanges, srcNode);
        }

        if (copy && !isEmpty(changesToApply)) applyChanges(copy, changesToApply);
        prevChanges = {...curChanges};
    }

    const rCopy = computed(() => {
        updateCopy();
        if (copy && !isEmpty(rNodeChanges.value)) return copy; // For consistency we only return the overwritten node if it actually has to be overwritten
        else return null; // If the copy is identical to the src node or if there is no copy
    });

    return {rCopy};

}