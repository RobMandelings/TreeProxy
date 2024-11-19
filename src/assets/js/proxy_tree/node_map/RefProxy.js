import {computed, reactive} from "vue";
import {createCustomProxy, useShouldExcludeProperty, wrappedProxyTargetGetter} from "@pt/proxy_utils/ProxyUtils.js";
import {deepGet} from "@pt/proxy_utils/Utils.js";

function createdNestedRefProxy(nodeMap, rNode, rId, targetPath) {

    /*
    We cannot use static targets because rNode might change
    (When a value is adjusted and we are working with overlay nodes,
    then rNode will change to a new reference. In that case, target should also change to reflect the
    new node reference.
     */
    const rTarget = computed(() => deepGet(rNode.value, targetPath));
    return createCustomProxy(reactive({target: rTarget}), {
        get(t, p, receiver) {
            const res = Reflect.get(t, p, receiver);
            if (typeof res === 'object') {
                targetPath += `.${p}`;
                return createdNestedRefProxy(nodeMap, rNode, rId, targetPath);
            }
            return res;
        },
        set(t, p, newValue, receiver) {
            nodeMap.set(rId.value, p, newValue);
        }
    })
}

export function createRefProxy(nodeMap, rId, rNode) {
    const targetObj = reactive({node: rNode, id: rId});

    const setHandler = (t, prop, value) => {
        nodeMap.set(rId.value, prop, value);
        return true;
    }

    const getHandler = (t, prop, receiver) => {
        return wrappedProxyTargetGetter(t, t.node, prop, receiver);
    }

    return createCustomProxy(targetObj, {
        get: getHandler,
        set: setHandler
    });
}