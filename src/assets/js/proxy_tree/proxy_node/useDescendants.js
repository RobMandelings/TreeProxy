import {decorateNodeRelatives, findById, useNodeRelatives} from "@pt/proxy_node/nodeRelatives.js";

export function useDescendants(proxyTree, children, rId) {

    /**
     * Descendants are inclusive: the node itself is also part of the list
     */
    const getDescendantsAsArray = () => {
        if (!children) return [];
        const descendants = [...children.asArray.flatMap(c => [c, ...c.descendants.asArray])];
        return [...descendants];
    }
    const nodeRelativesCore = useNodeRelatives(getDescendantsAsArray);

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
            const node = proxyTree.getNode(id);
            if (node && node.ancestors.has(rId.value)) return node;

            // Traverse all descendants
            const res = findById(t, id);
            if (res !== undefined) return res;
        }

        return decorateNodeRelatives(descendants, (t, prop) => {

            if (typeof prop === "string") {
                const res = findDescendantById(t, prop);
                if (res !== undefined) return res;

                // Try to find the descendant via path
                const numbers = prop.split(',').map(num => parseInt(num.trim()));
                if (numbers.some(n => isNaN(n))) return undefined; // Incorrect format
                if (numbers.length > 0) return getDescendantFromPath(numbers);
            }
        })
    }

    return decorateDescendants(nodeRelativesCore);
}