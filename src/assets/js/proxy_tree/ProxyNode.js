import {computed, reactive, ref, watch} from "vue";

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
        return [...proxyNode.children.flatMap(c => c.getDescendants(true))
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
    const deleteFn = () => {
        proxyTree.deleteNode(rProxyNode.value.id);
    }

    return {deleteFn: deleteFn};
}


export function createProxyNode(proxyTree, id, parentId) {
    const refProxy = proxyTree.createRefProxyNode(id);

    const rProxyNode = {
        value: null,
    }

    let rParentId = ref(parentId);
    let parentProxy = computed(() => proxyTree.getNode(rParentId.value));
    let children = computed(() => proxyTree.getChildren(id));

    const hasChildrenFn = () => !!children.value?.length;

    const {findFn} = useFind(rProxyNode);
    const {getAncestors, getDescendants} = useLineage(rProxyNode);
    const {deleteFn} = useDelete(proxyTree, rProxyNode);

    const targetObj = reactive({
        refProxy,
        children,
        parent: parentProxy,
        getAncestors,
        getDescendants,
        delete: deleteFn,
        hasChildren: hasChildrenFn,
        find: findFn
    });


    watch(() => refProxy.stale, (vN) => {
        if (vN && proxyTree.getNode(refProxy.id)) proxyTree.deleteNode(vN);
    });

    const handler = {
        get(t, prop, receiver) {
            return Reflect.get(t.refProxy, prop, receiver) // TODO reverse if possible
                ?? Reflect.get(t, prop, receiver);
        },
        set(t, prop, value, receiver) {
            return Reflect.set(t.refProxy, prop, value, receiver);
        }
    }
    rProxyNode.value = new Proxy(targetObj, handler);
    return rProxyNode.value;
}