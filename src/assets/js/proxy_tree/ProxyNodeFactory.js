import {DirectNodeAccessError, StaleProxyError} from "@pt/ProxyNodeErrors.js";
import {createCustomProxy, useShouldExcludeProperty, wrappedProxyTargetGetter} from "@pt/proxy_utils/ProxyUtils.js";
import {createBaseProxyNodeTarget} from "@pt/BaseProxyNode.js";
import {isReactive, reactive, toRefs} from "vue";

/**
 * TODO use TypeScript to add typing to the returned objects (e.g. what properties are available etc)
 */
export class ProxyNodeFactory {

    _createProxyTarget(proxyTree, id, parentId) {
        throw new Error("Abstract method");
    }

    /**
     * All core functionality of proxy nodes is included here. Simple proxy that checks in target first
     * Then checks in nodeRef.
     */
    __createBaseProxyNode(proxyTree, id, parentId) {
        const target = createBaseProxyNodeTarget(proxyTree, id, parentId);
        return createCustomProxy(target, {
            get(t, prop, receiver) {
                return wrappedProxyTargetGetter(t, t.nodeRef, prop, receiver);
            },
            set(t, prop, value, receiver) {
                return Reflect.set(t.nodeRef, prop, value, receiver);
            }
        });
    }

    decorateProxyNode(proxyTree, proxyNode) {
        return {};
    }

    _createProxyNode(proxyTree, id, parentId, beforeGetFn) {

        const proxyNode = this.__createBaseProxyNode(proxyTree, id, parentId);
        const decoratedFunctionality = this.decorateProxyNode(proxyTree, proxyNode);
        const decoratedFunctionalityAsRefs = isReactive(decoratedFunctionality) ? toRefs(decoratedFunctionality) : decoratedFunctionality;

        const target = reactive({__proxyNode__: proxyNode});

        const handler = {
            get: (t, prop, receiver) => {
                if (beforeGetFn) beforeGetFn(t, prop, receiver);

                if (prop === "node") throw new DirectNodeAccessError();

                if (prop in t || proxyNode.hasProp(prop)) {
                    if (prop === "stale") return proxyNode.stale;
                    else if (proxyNode.stale) {
                        if (prop === "toJSON") return {msg: "This proxy is stale"};
                        else throw new StaleProxyError();
                    }
                }

                return wrappedProxyTargetGetter(t, proxyNode, prop, receiver);
            },
            set: (t, prop, value, receiver) => {
                const success = Reflect.set(t.__proxyNode__, prop, value, receiver);
                if (success) proxyTree.markOverlaysDirty();
                return success;
            }
        }

        return new createCustomProxy(target, handler);
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