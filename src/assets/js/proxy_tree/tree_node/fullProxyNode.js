import {DirectNodeAccessError, StaleProxyError} from "@pt/tree_node/ProxyNodeErrors.js";
import {wrappedProxyTargetGetter} from "@pt/proxy_utils/ProxyUtils.js";
import {createCustomProxy} from "@pt/proxy_utils/CustomProxy.js";

export function createFullProxyNode(baseProxyNode, decoratedFunctionality, proxyTree, beforeGetFn) {

    const target = {__base__: baseProxyNode, __decorated__: decoratedFunctionality};

    const handler = {
        get: (t, prop, receiver) => {
            if (beforeGetFn) beforeGetFn(t, prop, receiver);

            if (prop === "node") throw new DirectNodeAccessError();
            else if (prop === "stale") return baseProxyNode.stale;
            else if (baseProxyNode.stale) {
                if (prop === "toJSON") return {msg: "This proxy is stale"};
                else throw new StaleProxyError();
            }

            return wrappedProxyTargetGetter(t.__decorated__, t.__base__, prop, receiver);
        },
        set: (t, prop, value, receiver) => {
            const success = Reflect.set(t.__base__, prop, value, receiver);
            if (success) proxyTree.markOverlaysDirty();
            return success;
        }
    }

    return new createCustomProxy(target, handler, {name: "ProxyNode"});
}