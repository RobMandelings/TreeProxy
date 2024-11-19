import {computed, reactive} from "vue";
import {createCustomProxy, useShouldExcludeProperty, wrappedProxyTargetGetter} from "@pt/proxy_utils/ProxyUtils.js";
import {deepGet} from "@pt/proxy_utils/Utils.js";

function createdNestedRefProxy(nodeMap, rNode, rId, targetPath) {

    const rTarget = computed(() => deepGet(rNode.value, targetPath));
    return createCustomProxy(reactive({rTarget}), {
        get(t, p, receiver) {
            const r = Reflect.get(t, p, receiver);
            if (typeof r === 'object') {
                targetPath += `.${p}`;
                return createdNestedRefProxy(nodeMap, rNode, rId, r, targetPath);
            }
            return r;
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