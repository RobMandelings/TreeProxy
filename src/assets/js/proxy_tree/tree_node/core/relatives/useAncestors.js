import {decorateWithFind, findById, useRelatives} from "@pt/tree_node/core/relatives/useRelatives.js";

export function useAncestors(rParent) {

    const getAncestorsAsArrayFn = () => {
        const parent = rParent.value;
        if (!parent) return [];

        return [parent, ...parent.ancestors.asArray];
    }

    const nodeRelativesCore = useRelatives(getAncestorsAsArrayFn)

    const ancestorsObj = Object.create(
        Object.getPrototypeOf(nodeRelativesCore),
        Object.getOwnPropertyDescriptors(nodeRelativesCore)
    );

    Object.defineProperties(ancestorsObj, {
        root: {
            get: () => nodeRelativesCore.asArray.at(-1),
            enumerable: true,
            configurable: true,
        },
    });

    // ancestors[n] -> retrieve the n-th ancestor
    return decorateWithFind(ancestorsObj);
}