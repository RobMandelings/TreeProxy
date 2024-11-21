import {computed, reactive, ref} from "vue";
import {useAddChild, useChildren} from "@pt/tree_node/core/relatives/useChildren.js";
import {useAncestors} from "@pt/tree_node/core/relatives/useAncestors.js";
import {useDescendants} from "@pt/tree_node/core/relatives/useDescendants.js";
import {useLeafs} from "@pt/tree_node/core/relatives/useLeafs.js";
import {createCustomProxy} from "@pt/proxy_utils/CustomProxy.js";
import {wrappedProxyTargetGetter} from "@pt/proxy_utils/ProxyUtils.js";

export function useDelete(proxyTree, rId) {
    const deleteFn = () => proxyTree.deleteElement(rId.value);
    return {deleteFn: deleteFn};
}

function useParent(rId, proxyTree, initialParentId) {

    let rParentId = ref(initialParentId);
    let rParentProxy = computed(() => proxyTree.getElement(rParentId.value));
    const setParent = (parentId) => {
        proxyTree.moveTo(rId.value, parentId);
        rParentId.value = parentId;
    }

    return {rParent: rParentProxy, setParent};
}

function useReplace(proxyTree, rId) {

    const replaceFn = (node) => proxyTree.replaceNode(rId.value, node);
    return {replaceFn};
}

function useHeight(children) {

    const rHeight = computed(() => Math.max(...children.asArray.map(c => c.height + 1), 0));
    return {rHeight};
}

function useDirty(proxyTree, rParent, rId, prevProxy) {

    const changedParent = () => rParent.value?.id !== prevProxy.parent?.id;
    const rIsDirty = computed(() => changedParent() || proxyTree.isDirty(rId.value));

    const dirtyPropProxy = new Proxy({}, {
        get(target, p, receiver) {
            if (p === "parent") return changedParent();
            return proxyTree.isPropDirty(rId.value, p);
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

function usePos(proxyTree, rParent, rId) {

    const rPos = computed(() => {
        if (!rParent.value) return 0;
        return rParent.value.children.asArray.findIndex(c => c.id === rId.value);
    });

    const movePosFn = (p) => proxyTree.movePos(rId.value, p);

    const rMaxPos = computed(() => {
        if (!rParent.value) return 0;
        return rParent.value.children.size - 1;
    });

    return {rPos, rMaxPos, movePosFn}
}

function createBaseProxyNodeTarget(proxyTree, id, parentId) {


    const nodeRef = proxyTree.nodeMap.createNodeRef(id);

    const rId = computed(() => nodeRef.id);
    const rStale = computed(() => nodeRef.stale || !proxyTree.getElement(id));

    const {rParent, setParent} = useParent(rId, proxyTree, parentId)

    const children = useChildren(rId, computed(() => nodeRef.childrenIds), proxyTree);
    const ancestors = useAncestors(rParent);
    const descendants = useDescendants(proxyTree, children, rId);
    const rRoot = computed(() => {
        if (!ancestors.size) return proxyTree.getElement(rId.value);
        return ancestors[-1];
    })
    const leafs = useLeafs(proxyTree, descendants);
    const isDescendantOf = (id) => !!ancestors.has(id);
    const isAncestorOf = (id) => !!descendants.has(id);
    const hasChildren = computed(() => children.size > 0);
    const isLeaf = computed(() => !hasChildren.value);

    const findFn = (id) => proxyTree.getElement(id);

    const {rPos, rMaxPos, movePosFn} = usePos(proxyTree, rParent, rId);

    const {deleteFn} = useDelete(proxyTree, rId);
    const {replaceFn} = useReplace(proxyTree, rId);
    const rDepth = computed(() => ancestors.size);
    const {rHeight} = useHeight(children);
    const {prevProxy} = usePreviousValue(proxyTree, rId);
    const {rIsDirty, dirtyPropProxy} = useDirty(proxyTree, rParent, rId, prevProxy);
    const rOverlayType = useOverlayType(proxyTree, rId);
    const addChildFn = useAddChild(rId, proxyTree);

    const target = {
        nodeRef,
        overlayType: rOverlayType,
        children,
        ancestors,
        descendants,
        findNode: findFn,
        leafs,
        root: rRoot,
        isDescendantOf,
        isAncestorOf,
        hasChildren,
        isLeaf,
        pos: rPos,
        maxPos: rMaxPos,
        movePos: movePosFn,
        addChild: addChildFn,
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
                name: nodeRef.name,
            }
            if (children.size) obj.children = children.asArray.map(c => c.toJSON());
            return obj;
        }
    };
    target.hasProp = (prop) => prop in target || target.nodeRef.hasProp(prop);

    return target;
}


export function createBaseProxyNode(proxyTree, id, parentId) {
    let target = createBaseProxyNodeTarget(proxyTree, id, parentId);
    return createCustomProxy(target, {
        get(t, prop, receiver) {
            return wrappedProxyTargetGetter(t, t.nodeRef, prop, receiver);
        },
        set(t, prop, value, receiver) {
            return Reflect.set(t.nodeRef, prop, value, receiver);
        }
    });
}