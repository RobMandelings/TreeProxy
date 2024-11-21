import {computed, reactive} from "vue";
import {
    reactiveReflectGet,
    wrappedProxyTargetGetter
} from "@pt/proxy_utils/ProxyUtils.js";

import {deepGet} from "@pt/utils/deepObjectUtil.js";
import {createCustomProxy} from "@pt/proxy_utils/CustomProxy.js";

/**
 * NodeRef for nested properties. E.g. node.gui is a nested property, but when you set node.gui.style = "" for example,
 * you want the change to be handled by the NodeMap and not the gui object itself. Without this nested node ref, setting node.gui.style to another value
 * would always alter the style property of the original gui object. In overlay nodes, we want to leave the original object intact.
 */
function createNestedNodeRef(nodeMap, rNode, rId, targetPath) {

    /*
    We cannot use static targets because rNode might change
    (When a value is adjusted and we are working with overlay nodes,
    then rNode will change to a new reference. In that case, target should also change to reflect the
    new node reference.
     */
    const rTarget = computed(() => deepGet(rNode.value, targetPath));
    return createCustomProxy({rTarget}, {
        get(t, p, receiver) {
            const res = reactiveReflectGet(rTarget.value, p, receiver);
            if (typeof res === 'object' && res != null && !(res instanceof Array)) {
                targetPath += `.${p}`;
                return createNestedNodeRef(nodeMap, rNode, rId, targetPath);
            }
            return res;
        },
        set(t, prop, newValue, receiver) {
            nodeMap.set(rId.value, `${targetPath}.${prop}`, newValue);
            return true;
        }
    }, {name: "NestedRefProxy", targetPath: targetPath})
}

/**
 * rNode: ref to the current node (with id). A ref is used such that the underlying reference can be changed dynamically.
 * This is essential for computed trees, as computed nodes reference a copied version if altered, and otherwise reference the source node version
 */
export function createNodeRef(nodeMap, rId, rNode) {

    const nodeInstanceOf = (instType) => rNode.value instanceof instType;

    // Target object is made reactive so that all properties of the node can be watched
    const rStale = computed(() => !rNode.value);
    const hasProp = (prop) => {
        return rNode.value && prop in rNode.value;
    }

    const targetObj = {__node__: rNode, nodeInstanceOf, stale: rStale, id: rId, hasProp};

    const setHandler = (t, prop, value) => {
        nodeMap.set(rId.value, prop, value);
        return true;
    }

    // TODO provide array support as well: childrenIds.push etc. Now you have to do careful assignment to not mess up
    // References
    const getHandler = (t, prop, receiver) => {
        let res = wrappedProxyTargetGetter(t, t.__node__.value, prop, receiver)
        if (typeof res === 'object'
            && !(res instanceof Array)
            && !(res == null)
            && !(res === t.__node__) // Don't wrap the node object in a proxy. If it is explicitly retrieved, then raw access is meant.
        ) res = createNestedNodeRef(nodeMap, rNode, rId, prop);
        return res;
    }

    return createCustomProxy(targetObj, {
        get: getHandler,
        set: setHandler
    });
}