import {computed, reactive, ref} from "vue";
import {DirectNodeAccessError, PosOutOfRangeError, StaleProxyError} from "./ProxyNodeErrors.js";

export function useFind(rProxyNode) {
    const findFn = (id) => {
        const proxyNode = rProxyNode.value;
        if (!proxyNode.children.length)
            if (proxyNode.id === id) return proxyNode;

        for (let c of proxyNode.children) {
            const res = c.find(id);
            if (res) return res;
        }
        return null;
    }

    return {findFn}
}

export function useLineage(rProxyNode) {


    return {getAncestors};
}

export function useDelete(proxyTree, rProxyNode) {
    const deleteFn = () => proxyTree.deleteNode(rProxyNode.value.id);
    return {deleteFn: deleteFn};
}

function useParent(rId, proxyTree, initialParentId) {

    let rParentId = ref(initialParentId);
    let rParentProxy = computed(() => proxyTree.getNode(rParentId.value));
    const setParent = (parentId) => {
        proxyTree.moveTo(rId.value, parentId);
        rParentId.value = parentId;
    }

    return {rParent: rParentProxy, setParent};
}

function useNodeRelatives(asArrayFn) {

    const hasFn = (id) => !!getByIdFn(id);
    const getByIdFn = (id) => asArrayFn().find(e => e.id === id);
    const asSetFn = () => new Set(asArrayFn());
    const getSizeFn = () => asArrayFn().length;

    const hasAnyFn = () => !!getSizeFn();

    return {
        get asArray() {
            return asArrayFn();
        },
        get asSet() {
            return asSetFn();
        },
        has: hasFn,
        get hasAny() {
            return hasAnyFn();
        },
        get size() {
            return getSizeFn();
        },
        get: {
            byId: getByIdFn,
        }
    }
}

function useAncestors(rProxyNode) {

    const getAncestorsAsArrayFn = () => {
        const proxyNode = rProxyNode.value;
        if (!proxyNode) return [];

        if (!proxyNode.parent) return [rProxyNode.value];
        return [rProxyNode.value, ...proxyNode.parent.ancestors.asArray];
    }

    return useNodeRelatives(getAncestorsAsArrayFn);
}

function useDescendants(rProxyNode) {

    /**
     * Descendants are inclusive: the node itself is also part of the list
     */
    const getDescendantsAsArray = () => {
        const proxyNode = rProxyNode.value;
        if (!proxyNode) return [];
        const descendants = [...proxyNode.children.asArray.flatMap(c => c.selfAndDescendants.asArray)];
        return [proxyNode, ...descendants];
    }

    const nodeRelativesCore = useNodeRelatives(getDescendantsAsArray);
    const descendantsObj = Object.create(
        Object.getPrototypeOf(nodeRelativesCore),
        Object.getOwnPropertyDescriptors(nodeRelativesCore)
    );

    const getDescendantFromPath = (posPath) => {
        const proxyNode = rProxyNode.value;
        if (!proxyNode) return null;
        let curChild = proxyNode.children.get.byPos(posPath.shift());
        while (posPath.length > 1) {
            if (!curChild) break;
            curChild = curChild.children.get.byPos(posPath.shift());
        }

        return curChild;
    }

    Object.defineProperties(descendantsObj.get, {
        fromPath: {
            get: () => getDescendantFromPath,
            enumerable: true,
            configurable: true,
        },
    });

    return descendantsObj;
}

function useChildren(rId, rChildrenIds, proxyTree) {

    const rChildrenArray = computed(() => proxyTree.getChildren(rId.value));

    const rChildrenIdsAsArray = computed(() => rChildrenIds.value);
    const getChildrenIdsAsSet = () => new Set(rChildrenIdsAsArray.value);

    const nodeRelativesCore = useNodeRelatives(() => rChildrenArray.value);

    const getChildByPos = (pos) => {
        const maxPos = nodeRelativesCore.size - 1;
        if ((pos < 0 || pos > maxPos) && pos !== -1) {
            throw new PosOutOfRangeError(pos, maxPos);
        }
        return rChildrenArray.value.at(pos) ?? null;
    }

    const getFirst = () => {
        if (!nodeRelativesCore.size) return null;
        return getChildByPos(0);
    }

    const childrenObj = Object.create(
        Object.getPrototypeOf(nodeRelativesCore),
        Object.getOwnPropertyDescriptors(nodeRelativesCore)
    );

    Object.defineProperties(childrenObj.get, {
        first: {
            get: () => getFirst(),
            enumerable: true,
            configurable: true,
        },
        byPos: {
            get: () => (pos) => getChildByPos(pos),
            enumerable: true,
            configurable: true,
        }
    });

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

    return childrenObj;
}


export function createProxyNode(proxyTree, id, parentId) {
    const refProxy = proxyTree.nodeMap.createRefNode(id);

    const rProxyNode = {
        value: null,
    }
    const rId = computed(() => rProxyNode.value?.id);

    const rStale = computed(() => {
        if (!rProxyNode.value) return false; // Still initialising
        return !(refProxy.node && proxyTree.getNode(id));
    });

    const {rParent, setParent} = useParent(computed(() => rProxyNode.value?.id), proxyTree, parentId)
    const {findFn} = useFind(rProxyNode);
    const children = useChildren(rId, computed(() => refProxy.childrenIds), proxyTree);
    const selfAndDescendants = useDescendants(rProxyNode);
    const {deleteFn} = useDelete(proxyTree, rProxyNode);

    const targetObj = reactive({
        refProxy,
        children,
        selfAndDescendants,
        parent: rParent,
        setParent,
        stale: rStale,
        delete: deleteFn,
        find: findFn
    });

    const handler = {
        get(t, prop, receiver) {
            if (prop === "node") throw new DirectNodeAccessError();
            if (prop === "stale") return rStale.value;
            else if (rStale.value) throw new StaleProxyError();

            return Reflect.get(t, prop, receiver)
                ?? Reflect.get(t.refProxy, prop, receiver);
        },
        set(t, prop, value, receiver) {

            return Reflect.set(t.refProxy, prop, value, receiver);
        }
    }
    rProxyNode.value = new Proxy(targetObj, handler);
    return rProxyNode.value;
}