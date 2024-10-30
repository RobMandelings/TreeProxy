import {computed, reactive, ref, watch} from "vue";
import {DirectNodeAccessError, StaleProxyError} from "./ProxyNodeErrors.js";

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

function useParent(rId, proxyTree, initialParentId) {

    let rParentId = ref(initialParentId);
    let rParentProxy = computed(() => proxyTree.getNode(rParentId.value));
    const setParent = (parentId) => proxyTree.moveTo(rId.value, parentId);

    return {rParent: rParentProxy, setParent};
}

function useChildren(proxyTree) {

    // descendants.asArray()
    // descendants.asSet()
    // descendants.get.byId(id)

    // ancestors.get.byId(id)

    // children.asArray()
    // children.asSet()
    // children.has()

    // children.get.byPos()
    // children.get.byId()

    // children.ids.asArray()
    // children.ids.asSet()
    // children.ids.has()



}


export function createProxyNode(proxyTree, id, parentId) {
    const refProxy = proxyTree.createRefProxyNode(id);

    const rProxyNode = {
        value: null,
    }


    let children = computed(() => proxyTree.getChildren(id));
    const rStale = computed(() => {
        if (!rProxyNode.value) return false; // Still initialising
        return !(refProxy.node && proxyTree.getNode(id));
    });

    const hasChildrenFn = () => !!children.value?.length;

    const {rParent, setParent} = useParent(computed(() => rProxyNode.value?.id), proxyTree, parentId)
    const {findFn} = useFind(rProxyNode);
    const {getAncestors, getDescendants} = useLineage(rProxyNode);
    const {deleteFn} = useDelete(proxyTree, rProxyNode);

    const targetObj = reactive({
        refProxy,
        children,
        parent: rParent,
        setParent,
        stale: rStale,
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