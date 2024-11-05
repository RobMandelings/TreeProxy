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

        if (!proxyNode.parent) return [];
        return [proxyNode.parent, ...proxyNode.parent.ancestors.asArray];
    }

    const decorateAncestors = (ancestors) => {
        return decorateNodeRelatives(ancestors, (t, prop) => {

            const res = findById(t, prop);
            if (res !== undefined) return res;

            if (typeof prop === "number") return t.asArray[prop]; // ancestors[n] -> retrieve the n-th ancestor
        });
    }

    return decorateAncestors(useNodeRelatives(getAncestorsAsArrayFn));
}

function useDescendants(rProxyNode, proxyTree) {

    /**
     * Descendants are inclusive: the node itself is also part of the list
     */
    const getDescendantsAsArray = () => {
        const proxyNode = rProxyNode.value;
        if (!proxyNode) return [];
        const descendants = [...proxyNode.children.asArray.flatMap(c => [c, ...c.descendants.asArray])];
        return [...descendants];
    }
    const nodeRelativesCore = useNodeRelatives(getDescendantsAsArray);

    const decorateDescendants = (descendants, rProxyNode) => {
        const getDescendantFromPath = (posPath) => {
            const proxyNode = rProxyNode.value;
            if (!proxyNode) return null;
            let curChild = proxyNode.children[posPath.shift()];
            while (posPath.length > 1) {
                if (!curChild) break;
                curChild = curChild.children[posPath.shift()];
            }

            return curChild;
        }

        const findDescendantById = (t, id) => {
            // Try to find in the efficient way.
            // Doing a map query and then finding the proper ancestor should be more efficient.
            const node = proxyTree.getNode(id);
            if (node && node.ancestors.has(rProxyNode.value?.id)) return node;

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

    return decorateDescendants(nodeRelativesCore, rProxyNode);
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

    const decorateChildren = (children) => {
        return decorateNodeRelatives(children, (t, prop) => {

            const res = findById(t, prop);
            if (res !== undefined) return res;

            if (typeof prop === "number") return t.asArray[prop];
        })
    }

    return decorateChildren(childrenObj);
}

function findById(t, prop) {
    if (typeof prop === 'string' && t.has(prop)) {
        return t.asArray.find(c => c.id === prop);
    }
}

function decorateNodeRelatives(nodeRelatives, customGetHandler) {
    return new Proxy(nodeRelatives, {
        get(t, prop, receiver) {
            if (prop in t) return Reflect.get(t, prop, receiver);

            if (typeof prop === 'string' && !isNaN(prop)) prop = parseInt(prop);

            const res = customGetHandler(t, prop);
            if (res !== undefined) return res;

            return Reflect.get(t, prop, receiver); // Always a Reflect.get required for vue to properly initialise reactivity and such
        }
    });
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
    const ancestors = useAncestors(rProxyNode);
    const descendants = useDescendants(rProxyNode, proxyTree);
    const isDescendantOf = (id) => !!ancestors.has(id);
    const isAncestorOf = (id) => !!descendants.has(id);

    const {deleteFn} = useDelete(proxyTree, rProxyNode);

    const targetObj = reactive({
        refProxy,
        children,
        ancestors,
        descendants,
        isDescendantOf,
        isAncestorOf,
        parent: rParent,
        setParent,
        stale: rStale,
        delete: deleteFn,
        find: findFn,
        toJSON: () => {
            let obj = {
                id: rId.value,
                name: refProxy.name,
            }
            if (children.size) obj.children = children.asArray.map(c => c.toJSON());
            return obj;
        }
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