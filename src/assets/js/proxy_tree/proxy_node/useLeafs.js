import {decorateWithFind, useNodeRelatives} from "@pt/proxy_node/nodeRelatives.js";

export function useLeafs(proxyTree, descendants) {
    const getLeafsAsArray = () => descendants.asArray.filter(d => d.isLeaf);
    const nodeRelativesCore = useNodeRelatives(getLeafsAsArray);

    return decorateWithFind(nodeRelativesCore);
}