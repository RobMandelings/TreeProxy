import {computed, reactive} from "vue";
import {createCustomProxy, useShouldExcludeProperty, wrappedProxyTargetGetter} from "@pt/proxy_utils/ProxyUtils.js";

import {deepGet} from "@pt/utils/deepObjectUtil.js";

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
            const t2 = t.target;
            const res = Reflect.get(t.target, p, receiver);
            if (typeof res === 'object' && res != null && !(res instanceof Array)) {
                targetPath += `.${p}`;
                return createdNestedRefProxy(nodeMap, rNode, rId, targetPath);
            }
            return res;
        },
        set(t, prop, newValue, receiver) {
            nodeMap.set(rId.value, `${targetPath}.${prop}`, newValue);
            return true;
        }
    })
}

export function createRefProxy(nodeMap, rId, rNode) {

    const nodeInstanceOf = (instType) => rNode.value instanceof instType;

    const targetObj = reactive({node: rNode, nodeInstanceOf, id: rId});

    const setHandler = (t, prop, value) => {
        nodeMap.set(rId.value, prop, value);
        return true;
    }

    // TODO provide array support as well: childrenIds.push etc. Now you have to do careful assignment to not mess up
    // References
    const getHandler = (t, prop, receiver) => {
        let res = wrappedProxyTargetGetter(t, t.node, prop, receiver)
        if (typeof res === 'object'
            && !(res instanceof Array)
            && !(res === t.node) // Don't wrap the node object in a proxy. If it is explicitly retrieved, then raw access is meant.
        ) res = createdNestedRefProxy(nodeMap, rNode, rId, prop);
        return res;
    }

    return createCustomProxy(targetObj, {
        get: getHandler,
        set: setHandler
    });
}