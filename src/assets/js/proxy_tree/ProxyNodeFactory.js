import {DirectNodeAccessError, StaleProxyError} from "@pt/ProxyNodeErrors.js";
import {useShouldExcludeProperty, wrappedProxyTargetGetter} from "@pt/proxy_utils/ProxyUtils.js";
import {createBaseProxyNodeTarget} from "@pt/BaseProxyNode.js";

const coreGetHandler = (t, prop, receiver) => {
    if (prop === "node") throw new DirectNodeAccessError();

    if (prop in t || prop in t.nodeRef) {
        if (prop === "stale") return t.stale;
        else if (t.stale) {
            if (prop === "toJSON") return {msg: "This proxy is stale"};
            else throw new StaleProxyError();
        }
    }

    return wrappedProxyTargetGetter(t, t.nodeRef, prop, receiver);
}

/**
 * TODO use TypeScript to add typing to the returned objects (e.g. what properties are available etc)
 */
export class ProxyNodeFactory {

    _createProxyTarget(proxyTree, id, parentId) {
        throw new Error("Abstract method");
    }

    _createProxyNode(proxyTree, id, parentId, beforeGetFn) {

        const proxyId = crypto.randomUUID(); // Unique id for each proxy. Used in testing while comparing proxies.
        const target = this._createProxyTarget(proxyTree, id, parentId);
        const excludePropFn = useShouldExcludeProperty(target);
        const handler = {
            get: (t, prop, receiver) => {
                // Otherwise vue will get the raw target upon assignment in reactive object
                // Then we will lose our Proxy! Very important line.
                if (prop === "__v_raw") return undefined;
                if (prop === "__proxyId__") return proxyId;
                if (excludePropFn(prop)) return Reflect.get(t, prop, receiver);

                if (beforeGetFn) beforeGetFn(t, prop, receiver);
                return coreGetHandler(t, prop, receiver);
            },
            set: (t, prop, value, receiver) => {
                const success = Reflect.set(t.nodeRef, prop, value, receiver);
                if (success) proxyTree.markOverlaysDirty();
                return success;
            }
        }

        return new Proxy(target, handler);
    }

    createSrcProxyNode(srcProxyTree, id, parentId) {
        return this._createProxyNode(srcProxyTree, id, parentId, null)
    }

    createComputedProxyNode(computedProxyTree, id, parentId) {
        const beforeGetFn = (t, prop, receiver) => {
            if (computedProxyTree.recomputeIfDirty) computedProxyTree.recomputeIfDirty();
        }

        return this._createProxyNode(computedProxyTree, id, parentId, beforeGetFn)
    }
}

class SimpleProxyNodeFactory extends ProxyNodeFactory {

    _createProxyTarget(proxyTree, id, parentId) {
        return createBaseProxyNodeTarget(proxyTree, id, parentId);
    }
}

export const SIMPLE_PROXY_NODE_FACTORY = new SimpleProxyNodeFactory();