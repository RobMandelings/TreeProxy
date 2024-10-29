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

export function createProxyNode(proxyTree, id, parentId) {
    const refProxy = proxyTree.createRefProxyNode(id);

    const rProxyNode = ref(null);
    let rParentId = ref(parentId);
    let parentProxy = computed(() => proxyTree.getNode(rParentId.value));
    let children = computed(() => proxyTree.getChildren(id));

    const targetObj = reactive({
        refProxy,
        children
    });

    const {findFn} = useFind(rProxyNode);

    watch(refProxy.stale, (vN) => {
        if (vN && proxyTree.getNode(refProxy.id)) proxyTree.deleteNode(vN);
    });

    const handler = {
        get(t, prop, receiver) {
            if (prop === 'parent') return parentProxy.value;
            if (prop === 'children') return children.value;
            if (prop === 'find') return findFn;

            return Reflect.get(t.refProxy, prop, receiver)
                ?? Reflect.get(t, prop, receiver);
        },
        set(t, prop, value, receiver) {
            return Reflect.set(t.refProxy, prop, value, receiver);
        }
    }
    rProxyNode = new Proxy(targetObj, handler)
    return rProxyNode;
}