import {computed, reactive} from "vue";
import {deepGetChangesToApply} from "@pt/ref_store/overlay/ChangeUnit.js";
import {applyChanges} from "@pt/utils/deepObjectUtil.js";
import {useDepTracking} from "@pt/utils/useDepTracking.js";

/**
 * Creates a computed property that represents the copied source node (with applied changes).
 */
export function useNodeCopy(nodeChanges, srcNodeMap, rId) {

    let prevChanges = {};

    const rDepTracker = computed(() => {
        // This one is essential to make the computed prop reactive on deep changes
        // It seems like it does nothing, but this makes sure that the computed prop is recalled whenever any of the properties in the srcNode changes
        // E.g. name change, weight change, or anything else. This will indirectly invalidate the copy of the overlay node.
        return useDepTracking([() => Object.values(rSrcNode.value)]);
    })
    const rSrcNodeChanged = computed(() => rDepTracker.value.hasDirtyDeps());

    const rSrcNode = computed(() => srcNodeMap.getElement(rId.value));

    let copy;
    const rNodeChanges = computed(() => nodeChanges.get(rId.value) ?? {});

    const rCopy = computed(() => {
        const srcNode = rSrcNode.value;
        const curChanges = rNodeChanges.value;
        let changesToApply;
        if (rSrcNodeChanged.value || // If the source node has changed in any way, we need to invalidate the current copy
            (!copy && Object.keys(curChanges).length) // In this case we need to create a new copy and apply all changes again
        ) {
            copy = reactive(srcNode.copy());
            changesToApply = curChanges; // Don't use prevChanges as it is a new copy
            rDepTracker.value.resetDirtyDeps();
        } else {
            // Compute the changes that should be applied based on current and prev changes.
            changesToApply = deepGetChangesToApply(prevChanges, curChanges, srcNode);
        }

        if (copy && Object.keys(changesToApply).length) applyChanges(copy, changesToApply);
        prevChanges = {...curChanges};

        if (copy && Object.keys(curChanges).length) return copy; // For consistency we only return the overwritten node if it actually has to be overwritten
        else return null; // If the copy is identical to the src node or if there is no copy
    });

    return {rCopy};

}