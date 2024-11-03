import {computed, reactive, ref, watch} from "vue";
import {DirectNodeAccessError, IllegalAccessError, PosOutOfRangeError, StaleProxyError} from "./ProxyNodeErrors.js";
import {ComputedNodeMap} from "../node_map/ComputedNodeMap.js";

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

    const rAncestors = computed(() => {
        const proxyNode = rProxyNode.value;
        if (!proxyNode.parent) return [];
        return [...proxyNode.parent.getAncestors(true)];
    });

    const rDescendants = computed(() => {
        const proxyNode = rProxyNode.value;
        return [...proxyNode.children.asArray.flatMap(c => c.getDescendants(true))
        ];
    });

    const getDescendants = (includeSelf = false) => {
        const descendants = rDescendants.value;
        if (includeSelf) return [rProxyNode.value, ...descendants];
        return descendants;
    }

    const getAncestors = (includeSelf = false) => {
        const ancestors = rAncestors.value;
        if (includeSelf) return [rProxyNode.value, ...ancestors];
        return ancestors;
    }

    return {getDescendants, getAncestors};
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

function useChildren(rId, rChildrenIds, proxyTree) {

    const rChildrenArray = computed(() => proxyTree.getChildren(rId.value));
    const rSize = computed(() => rChildrenArray.value.length);
    const getChildrenAsSet = () => new Set(rChildrenArray.value);

    const hasChild = (id) => !!getChildById(id);
    const rChildrenIdsAsArray = computed(() => rChildrenIds.value);
    const getChildrenIdsAsSet = () => new Set(rChildrenIdsAsArray.value);

    const getChildById = (id) => {
        return rChildrenIdsAsArray.value.find(tmpId => tmpId === id);
    }
    const getChildByPos = (pos) => {
        const maxPos = rSize.value - 1;
        if ((pos < 0 || pos > maxPos) && pos !== -1) {
            throw new PosOutOfRangeError(pos, maxPos);
        }
        return rChildrenArray.value.at(pos) ?? null;
    }

    const deleteChildById = (id) => {

    }

    const getFirst = () => {
        if (!rSize.value) return null;
        return getChildByPos(0);
    }

    const hasChildrenFn = () => !!rSize.value;

    return {
        children: reactive({
            get asArray() {
                return rChildrenArray.value;
            },
            get asSet() {
                return getChildrenAsSet();
            },
            has: hasChild,
            size: rSize,
            ids: {
                get asArray() {
                    return rChildrenIdsAsArray.value;
                },
                get asSet() {
                    return getChildrenIdsAsSet();
                },
            },
            get: {
                get first() {
                    return getFirst();
                },
                byId: getChildById,
                byPos: getChildByPos
            },
        }),
        hasChildren: hasChildrenFn
    }
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
    const {getAncestors, getDescendants} = useLineage(rProxyNode);
    const {children, hasChildren} = useChildren(rId, computed(() => refProxy.childrenIds), proxyTree);
    const {deleteFn} = useDelete(proxyTree, rProxyNode);

    const targetObj = reactive({
        refProxy,
        children,
        hasChildren,
        parent: rParent,
        setParent,
        stale: rStale,
        getAncestors,
        getDescendants,
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