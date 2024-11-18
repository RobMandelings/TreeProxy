import {computed} from "vue";
import {decorateWithFind, findById, useNodeRelatives} from "@pt/proxy_node/nodeRelatives.js";

function useAddChild(rId, proxyTree) {

    const addNodeFn = (node, index = undefined) => proxyTree.addChild(rId.value, node, index);
    return {addNodeFn}
}

export function useChildren(rId, rChildrenIds, proxyTree) {

    const rChildrenArray = computed(() => proxyTree.getChildren(rId.value));
    const rChildrenIdsAsArray = computed(() => rChildrenIds.value);
    const getChildrenIdsAsSet = () => new Set(rChildrenIdsAsArray.value);
    const nodeRelativesCore = useNodeRelatives(() => rChildrenArray.value);
    const {addNodeFn} = useAddChild(rId, proxyTree);

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

    childrenObj.addNode = addNodeFn;

    return decorateWithFind(childrenObj);
}