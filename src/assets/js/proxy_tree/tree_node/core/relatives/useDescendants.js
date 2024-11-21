import {decorateWithFind, findById, useRelatives} from "@pt/tree_node/core/relatives/useRelatives.js";

export function useDescendants(proxyTree, children, rId) {
    
    const getDescendantsAsArray = () => {
        if (!children) return [];
        const descendants = [...children.asArray.flatMap(c => [c, ...c.descendants.asArray])];
        return [...descendants];
    }
    const nodeRelativesCore = useRelatives(getDescendantsAsArray);

    const decorateDescendants = (descendants) => {
        const getDescendantFromPath = (posPath) => {
            let curChild = children[posPath.shift()];
            while (posPath.length) {
                if (!curChild) break;
                curChild = curChild.children[posPath.shift()];
            }

            return curChild;
        }

        const findDescendantById = (t, id) => {
            // Try to find in the efficient way.
            // Doing a map query and then finding the proper ancestor should be more efficient.
            const node = proxyTree.getElement(id);
            if (node && node.ancestors.has(rId.value)) return node;

            // Traverse all descendants
            const res = findById(t, id);
            if (res !== undefined) return res;
        }

        const findDescendantViaPath = (t, prop) => {
            // Try to find the descendant via path
            const numbers = prop.split(',').map(num => parseInt(num.trim()));
            if (numbers.some(n => isNaN(n))) return undefined; // Incorrect format
            if (numbers.length > 0) return getDescendantFromPath(numbers);
        }

        const findDescendant = (t, prop) => {
            let res = findDescendantById(t, prop);
            if (res !== undefined) return res;
            res = findDescendantViaPath(t, prop)
            return res;
        }

        return decorateWithFind(descendants, findDescendant)
    }

    return decorateDescendants(nodeRelativesCore);
}