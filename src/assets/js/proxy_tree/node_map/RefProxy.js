import {reactive} from "vue";
import {useShouldExcludeProperty, wrappedProxyTargetGetter} from "@pt/proxy_utils/ProxyUtils.js";

export function createRefProxy(nodeMap, rId, rNode) {
    const targetObj = reactive({node: rNode, id: rId});

    const setHandler = (t, prop, value) => {
        nodeMap.set(rId.value, prop, value);
        return true;
    }

    const excludePropFn = useShouldExcludeProperty(targetObj);
    const getHandler = (t, prop, receiver) => {
        if (prop === "__target__") return t;
        if (excludePropFn(prop)) return Reflect.get(t, prop, receiver);
        return wrappedProxyTargetGetter(t, t.node, prop, receiver);
    }
    return new Proxy(targetObj, {
        get: getHandler,
        set: setHandler
    });
}