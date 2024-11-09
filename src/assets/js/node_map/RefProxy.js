import {computed, reactive, watch} from "vue";
import {useShouldExcludeProperty, wrappedProxyTargetGetter} from "../ProxyUtils.js";

function useDirty(rId, nodeMap) {
    const rDirty = computed(() => nodeMap.isDirty(rId.value));
    const isDirtyProp = (prop) => nodeMap.isDirtyProp(rId.value, prop);

    return {rDirty, isDirtyProp};
}

export function createRefProxy(nodeMap, rId, rNode) {

    const {rDirty, isDirtyProp} = useDirty(rId, nodeMap);
    const targetObj = reactive({node: rNode, id: rId, dirty: rDirty, isDirtyProp});

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