import {computed, reactive, ref} from "vue";
import {DirectNodeAccessError, StaleProxyError} from "@pt/ProxyNodeErrors.js";
import {
    useShouldExcludeProperty,
    wrappedProxyTargetGetter
} from "@pt/proxy_utils/ProxyUtils.js";
import {useChildren} from "@pt/proxy_node/useChildren.js";
import {useAncestors} from "@pt/proxy_node/useAncestors.js";
import {useDescendants} from "@pt/proxy_node/useDescendants.js";

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

function useReplace(rId, proxyTree) {

    const replaceFn = (node) => proxyTree.replaceNode(rId.value, node);
    return {replaceFn};
}

function useHeight(children) {

    const rHeight = computed(() => Math.max(...children.asArray.map(c => c.height + 1), 0));
    return {rHeight};
}

function useDirty(proxyTree, rProxyNode, prevProxy) {

    const changedParent = () => rProxyNode.value.parent?.id !== prevProxy.parent?.id;
    const rIsDirty = computed(() => changedParent() || proxyTree.isDirty(rProxyNode.value.id));

    const dirtyPropProxy = new Proxy({}, {
        get(target, p, receiver) {
            if (p === "parent") return changedParent();
            return proxyTree.isPropDirty(rProxyNode.value.id, p);
        },
        set(target, p, newValue, receiver) {
            throw new Error("Can't set value");
        }
    });

    return {
        rIsDirty,
        dirtyPropProxy: dirtyPropProxy,
    }
}

function usePreviousValue(proxyTree, rId) {

    // TODO perhaps we can set the source node as the proxy target as this might help with reactivity.
    // TODO don't know if this is still efficient thought
    const prevProxy = new Proxy({}, {
        get(target, p, receiver) {
            return proxyTree.getSrcNode(rId.value)[p];
        },
        set(target, p, newValue, receiver) {
            throw new Error("Cannot use the set operation on prev");
        }
    });

    return {
        prevProxy: prevProxy,
    }
}

function useOverlayType(proxyTree, rId) {
    return computed(() => proxyTree.getOverlayType(rId.value));
}

function createProxyNode(proxyTree, id, parentId, beforeGetFn) {
    const refProxy = proxyTree.nodeMap.createRefProxy(id);

    const rProxyNode = {
        value: null,
    }
    const rId = computed(() => rProxyNode.value?.id);

    const rStale = computed(() => {
        if (!rProxyNode.value) return false; // Still initialising
        return !(refProxy.node && proxyTree.getNode(id));
    });

    const {rParent, setParent} = useParent(computed(() => rProxyNode.value?.id), proxyTree, parentId)
    const children = useChildren(rId, computed(() => refProxy.childrenIds), proxyTree);
    const ancestors = useAncestors(rProxyNode);
    const descendants = useDescendants(rProxyNode, proxyTree);
    const isDescendantOf = (id) => !!ancestors.has(id);
    const isAncestorOf = (id) => !!descendants.has(id);

    const {deleteFn} = useDelete(proxyTree, rProxyNode);
    const {replaceFn} = useReplace(rId, proxyTree);
    const rDepth = computed(() => ancestors.size);
    const {rHeight} = useHeight(children);
    const {prevProxy} = usePreviousValue(proxyTree, rId);
    const {rIsDirty, dirtyPropProxy} = useDirty(proxyTree, rProxyNode, prevProxy);
    const rOverlayType = useOverlayType(proxyTree, rId);

    const target = reactive({
        refProxy,
        overlayType: rOverlayType,
        children,
        ancestors,
        descendants,
        isDescendantOf,
        isAncestorOf,
        replace: replaceFn,
        parent: rParent,
        setParent,
        stale: rStale,
        delete: deleteFn,
        depth: rDepth,
        height: rHeight,
        isDirty: rIsDirty,
        dirty: dirtyPropProxy,
        prev: prevProxy,
        toJSON: () => {
            let obj = {
                id: rId.value,
                name: refProxy.name,
            }
            if (children.size) obj.children = children.asArray.map(c => c.toJSON());
            return obj;
        }
    });

    const coreGetHandler = (t, prop, receiver) => {

        if (prop === "node") throw new DirectNodeAccessError();

        if (prop in t || prop in t.refProxy) {
            if (prop === "stale") return rStale.value;
            else if (rStale.value) {
                if (prop === "toJSON") return {msg: "This proxy is stale"};
                else throw new StaleProxyError();
            }
        }

        return wrappedProxyTargetGetter(t, t.refProxy, prop, receiver);
    }

    const excludePropFn = useShouldExcludeProperty(target);

    const handler = {
        get: (t, prop, receiver) => {
            if (excludePropFn(prop)) return Reflect.get(t, prop, receiver);

            if (beforeGetFn) beforeGetFn(t, prop, receiver);
            return coreGetHandler(t, prop, receiver);
        },
        set: (t, prop, value, receiver) => {
            const success = Reflect.set(t.refProxy, prop, value, receiver);
            if (success) proxyTree.markOverlaysDirty();
            return success;
        }
    }
    rProxyNode.value = new Proxy(target, handler);
    return rProxyNode.value;
}

export function createSrcProxyNode(srcProxyTree, id, parentId) {
    return createProxyNode(srcProxyTree, id, parentId, null)
}

export function createComputedProxyNode(computedProxyTree, id, parentId) {
    const beforeGetFn = (t, prop, receiver) => {
        if (computedProxyTree.recomputeIfDirty) computedProxyTree.recomputeIfDirty();
    }

    return createProxyNode(computedProxyTree, id, parentId, beforeGetFn)
}