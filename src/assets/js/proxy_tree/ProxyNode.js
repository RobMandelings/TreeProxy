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
        return [proxyNode.parent, ...proxyNode.parent.ancestors];
    });

    const rDescendants = computed(() => {
        const proxyNode = rProxyNode.value;
        return [
            ...proxyNode.children,
            ...proxyNode.children.flatMap(c => c.descendants)
        ];
    });

    return {rAncestors, rDescendants};
}


export function createProxyNode(proxyTree, id, parentId) {
    const refProxy = proxyTree.createRefProxyNode(id);

    const rProxyNode = {
        value: null,
    }

    let rParentId = ref(parentId);
    let parentProxy = computed(() => proxyTree.getNode(rParentId.value));
    let children = computed(() => proxyTree.getChildren(id));

    const targetObj = reactive({
        refProxy,
        children
    });

    const hasChildren = () => !!children.value?.length;

    const {findFn} = useFind(rProxyNode);
    const {rAncestors, rDescendants} = useLineage(rProxyNode);


    watch(() => refProxy.stale, (vN) => {
        if (vN && proxyTree.getNode(refProxy.id)) proxyTree.deleteNode(vN);
    });

    const handler = {
        get(t, prop, receiver) {
            if (prop === 'parent') return parentProxy.value;
            if (prop === 'children') return children.value;
            if (prop === 'descendants') return rDescendants.value;
            if (prop === 'ancestors') return rAncestors.value;
            if (prop === 'hasChildren') return hasChildren;
            // if (prop === 'find') return findFn;
            // if (prop === 'ancestors') return rAncestors.value;
            // if (prop === 'descendants') return rDescendants.value;

            return Reflect.get(t.refProxy, prop, receiver)
                ?? Reflect.get(t, prop, receiver);
        },
        set(t, prop, value, receiver) {
            return Reflect.set(t.refProxy, prop, value, receiver);
        }
    }
    rProxyNode.value = new Proxy(targetObj, handler);
    return rProxyNode.value;
}