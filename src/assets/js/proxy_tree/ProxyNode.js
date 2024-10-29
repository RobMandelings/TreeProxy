import {computed, reactive, ref, watch} from "vue";

export function createProxyNode(proxyTree, id, parentId) {
    const refProxy = proxyTree.createRefProxyNode(id);

    let rParentId = ref(parentId);
    let parentProxy = computed(() => proxyTree.getNode(rParentId.value));
    let children = computed(() => proxyTree.getChildren(id));

    const targetObj = reactive({
        refProxy,
        children
    });

    watch(refProxy.stale, (vN) => {
        if (vN && proxyTree.getNode(refProxy.id)) proxyTree.deleteNode(vN);
    });

    const handler = {
        get(t, prop, receiver) {
            if (prop === 'parent') return parentProxy.value;
            if (prop === 'children') return children.value;
            return Reflect.get(t.refProxy, prop, receiver)
                ?? Reflect.get(t, prop, receiver);
        },
        set(t, prop, value, receiver) {
            return Reflect.set(t.refProxy, prop, value, receiver);
        }
    }
    return new Proxy(targetObj, handler);
}