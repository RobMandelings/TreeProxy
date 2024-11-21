import {decorateWithFind, useRelatives} from "@pt/tree_node/core/relatives/useRelatives.js";

export function useLeafs(proxyTree, descendants) {
    const getLeafsAsArray = () => descendants.asArray.filter(d => d.isLeaf);
    const nodeRelativesCore = useRelatives(getLeafsAsArray);

    return decorateWithFind(nodeRelativesCore);
}