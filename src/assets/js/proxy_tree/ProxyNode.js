import {computed, reactive, ref} from "vue";
import {DirectNodeAccessError, PosOutOfRangeError, StaleProxyError} from "./ProxyNodeErrors.js";
import {CustomNode} from "../CustomNode.js";
import {getExcludeProperties, getReactiveTarget} from "../Utils.js";
import {useChildren} from "./proxy_node/useChildren.js";
import {useAncestors} from "./proxy_node/useAncestors.js";
import {useDescendants} from "./proxy_node/useDescendants.js";

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

    const target = reactive({
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

    const excludeProps = getExcludeProperties(target);

    const handler = {
        get(t, prop, receiver) {
            if (prop in excludeProps) return Reflect.get(t, prop, receiver);

            if (prop === "node") throw new DirectNodeAccessError();

            if (prop in t || prop in t.refProxy) {
                if (prop === "stale") return rStale.value;
                else if (rStale.value) {
                    if (prop === "toJSON") return {msg: "This proxy is stale"};
                    else throw new StaleProxyError();
                }

                return Reflect.get(t, prop, receiver)
                    ?? Reflect.get(t.refProxy, prop, receiver);
            }

            return Reflect.get(t, prop, receiver)
                ?? Reflect.get(t.refProxy, prop, receiver);
        },
        set(t, prop, value, receiver) {

            return Reflect.set(t.refProxy, prop, value, receiver);
        }
    }
    rProxyNode.value = new Proxy(target, handler);
    return rProxyNode.value;
}