import {decorateNodeRelatives, findById, useNodeRelatives} from "./nodeRelatives.js";

export function useAncestors(rProxyNode) {

    const getAncestorsAsArrayFn = () => {
        const proxyNode = rProxyNode.value;
        if (!proxyNode) return [];

        if (!proxyNode.parent) return [];
        return [proxyNode.parent, ...proxyNode.parent.ancestors.asArray];
    }

    const decorateAncestors = (ancestors) => {
        return decorateNodeRelatives(ancestors, (t, prop) => {
            if (typeof prop === 'string' && !isNaN(prop)) prop = parseInt(prop);

            const res = findById(t, prop);
            if (res !== undefined) return res;

            if (typeof prop === "number") return t.asArray.at(prop); // ancestors[n] -> retrieve the n-th ancestor
        });
    }

    return decorateAncestors(useNodeRelatives(getAncestorsAsArrayFn));
}