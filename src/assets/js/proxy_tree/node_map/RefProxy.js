import {computed, reactive} from "vue";
import {useShouldExcludeProperty, wrappedProxyTargetGetter} from "@pt/proxy_utils/ProxyUtils.js";
import {deepGet} from "@pt/proxy_utils/Utils.js";

/**
 * Helper function that creates a proxy that uses common interceptions used in this system.
 * Such as ignoring vue properties and providing a __target__ property for debugging purposes.
 * @param target
 * @param handler
 * @return {*|object}
 */
function createCustomProxy(target, handler) {

    /**
     * I deal with reactive targets, vue breaks some of the mechanics of default proxies.
     * E.g. when a reactive target is wrapped in a proxy, you receive all vue properties as well.
     * Such as __v_Reactive and __v_raw. Most of these things need to be ignored.
     */
    const excludePropFn = useShouldExcludeProperty(target);
    return new Proxy(target, {
        get(t, prop, receiver) {
            if (prop === "__target__") return t;
            if (excludePropFn(prop)) return Reflect.get(t, prop, receiver);
            return handler.get(t, prop, receiver);
        },
        set: handler.set
    })
}

function createdNestedRefProxy(nodeMap, rNode, rId, targetPath) {

    const rTarget = computed(() => deepGet(rNode.value, targetPath));
    return new Proxy(reactive({rTarget}), {
        get(t, p, receiver) {
            const r = Reflect.get(t, p, receiver);
            if (typeof r === 'object') {
                targetPath += `.${p}`;
                return createdNestedRefProxy(nodeMap, rId, r, targetPath);
            }
            return r;
        },
        set(t, p, newValue, receiver) {
            nodeMap.set(rId.value, p,)
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