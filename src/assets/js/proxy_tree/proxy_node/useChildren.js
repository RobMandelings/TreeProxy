import {computed} from "vue";
import {PosOutOfRangeError} from "../ProxyNodeErrors.js";
import {decorateNodeRelatives, findById, useNodeRelatives} from "./nodeRelatives.js";

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

    const decorateChildren = (children) => {
        return decorateNodeRelatives(children, (t, prop) => {
            if (typeof prop === 'string' && !isNaN(prop)) prop = parseInt(prop);

            const res = findById(t, prop);
            if (res !== undefined) return res;

            if (typeof prop === "number") return t.asArray.at(prop);
        })
    }

    return decorateChildren(childrenObj);
}