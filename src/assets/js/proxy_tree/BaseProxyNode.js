import {computed, reactive, ref} from "vue";
import {useChildren} from "@pt/proxy_node/useChildren.js";
import {useAncestors} from "@pt/proxy_node/useAncestors.js";
import {useDescendants} from "@pt/proxy_node/useDescendants.js";
import {useLeafs} from "@pt/proxy_node/useLeafs.js";

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

export function createBaseProxyNodeTarget(proxyTree, id, parentId) {
    const nodeRef = proxyTree.nodeMap.createRefProxy(id);

    const rId = computed(() => nodeRef.id);
    const rStale = computed(() => !(nodeRef.node && proxyTree.getElement(id)));

    const {rParent, setParent} = useParent(rId, proxyTree, parentId)

    const children = useChildren(rId, computed(() => nodeRef.childrenIds), proxyTree);
    const ancestors = useAncestors(rParent);
    const descendants = useDescendants(proxyTree, children, rId);
    const rRoot = computed(() => ancestors[-1])
    const leafs = useLeafs(proxyTree, descendants);
    const isDescendantOf = (id) => !!ancestors.has(id);
    const isAncestorOf = (id) => !!descendants.has(id);
    const hasChildren = computed(() => children.size > 0);
    const isLeaf = computed(() => !hasChildren.value);

    const {rPos, rMaxPos, movePosFn} = usePos(proxyTree, rParent, rId);

    const {deleteFn} = useDelete(proxyTree, rId);
    const {replaceFn} = useReplace(proxyTree, rId);
    const rDepth = computed(() => ancestors.size);
    const {rHeight} = useHeight(children);
    const {prevProxy} = usePreviousValue(proxyTree, rId);
    const {rIsDirty, dirtyPropProxy} = useDirty(proxyTree, rParent, rId, prevProxy);
    const rOverlayType = useOverlayType(proxyTree, rId);
    const nodeInstanceOf = (instType) => nodeRef.node instanceof instType;

    const target = reactive({
        nodeRef,
        nodeInstanceOf,
        overlayType: rOverlayType,
        children,
        ancestors,
        descendants,
        leafs,
        root: rRoot,
        isDescendantOf,
        isAncestorOf,
        hasChildren,
        isLeaf,
        pos: rPos,
        maxPos: rMaxPos,
        movePos: movePosFn,
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
    })

    return target;
}