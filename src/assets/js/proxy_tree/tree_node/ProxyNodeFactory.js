import {DirectNodeAccessError, StaleProxyError} from "@pt/tree_node/ProxyNodeErrors.js";
import {wrappedProxyTargetGetter} from "@pt/proxy_utils/ProxyUtils.js";
import {createBaseProxyNode, createBaseProxyNodeTarget} from "@pt/tree_node/core/baseProxyNode.js";
import {computed, isReactive, reactive, toRefs} from "vue";
import {createCustomProxy} from "@pt/proxy_utils/CustomProxy.js";

/**
 *
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
        return createBaseProxyNode(proxyTree, id, parentId);
    }

    decorateProxyNode(proxyTree, proxyNode) {
        return {};
    }

    _createProxyNode(proxyTree, id, parentId, beforeGetFn) {

        const proxyNode = this.__createBaseProxyNode(proxyTree, id, parentId);
        const decoratedFunctionality = this.decorateProxyNode(proxyTree, proxyNode);

        const target = {__base__: proxyNode, __decorated__: decoratedFunctionality};

        const handler = {
            get: (t, prop, receiver) => {
                if (beforeGetFn) beforeGetFn(t, prop, receiver);

                if (prop === "node") throw new DirectNodeAccessError();
                else if (prop === "stale") return proxyNode.stale;
                else if (proxyNode.stale) {
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

    decorateProxyNode(proxyTree, proxyNode) {
        return {randomStuff: computed(() => proxyNode.children.size + proxyNode.name)};
    }
}

export const SIMPLE_PROXY_NODE_FACTORY = new SimpleProxyNodeFactory();