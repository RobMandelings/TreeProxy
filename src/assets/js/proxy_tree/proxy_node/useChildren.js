import {computed} from "vue";
import {decorateWithFind, useNodeRelatives} from "@pt/proxy_node/nodeRelatives.js";

export function useAddChild(rId, proxyTree) {
    return (node, index = undefined) => proxyTree.addChild(rId.value, node, index)
}

export function useChildren(rId, rChildrenIds, proxyTree) {

    const rChildrenArray = computed(() => proxyTree.getChildren(rId.value));
    const rChildrenIdsAsArray = computed(() => rChildrenIds.value);
    const getChildrenIdsAsSet = () => new Set(rChildrenIdsAsArray.value);
    const nodeRelativesCore = useNodeRelatives(() => rChildrenArray.value);

    const childrenObj = Object.create(
        Object.getPrototypeOf(nodeRelativesCore),
        Object.getOwnPropertyDescriptors(nodeRelativesCore)
    );

    childrenObj.ids = {};
    Object.defineProperties(childrenObj.ids, {
        asArray: {
            get: () => rChildrenIdsAsArray.value,
            enumerable: true,
            configurable: true,
        },
        asSet: {
            get: getChildrenIdsAsSet,
            enumerable: true,
            configurable: true,
        }
    });

    return decorateWithFind(childrenObj);
}