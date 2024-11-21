import {createBaseProxyNode} from "@pt/tree_node/core/baseProxyNode.js";
import {createFullProxyNode} from "@pt/tree_node/fullProxyNode.js";

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

    /**
     * Add extra functionality to the proxy node that is not in the base version.
     *
     * E.g. for the grade system this means adding validEditModes, canAddTest, canAddVakonderdeel etc etc.
     */
    getDecoratedFunctionality(proxyTree, proxyNode) {
        return {};
    }

    _createProxyNode(proxyTree, id, parentId, beforeGetFn) {
        const proxyNode = this.__createBaseProxyNode(proxyTree, id, parentId);
        const decoratedFunctionality = this.getDecoratedFunctionality(proxyTree, proxyNode);
        return createFullProxyNode(proxyNode, decoratedFunctionality, proxyTree, beforeGetFn);
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

    getDecoratedFunctionality(proxyTree, proxyNode) {
        return {};
    }
}

export const SIMPLE_PROXY_NODE_FACTORY = new SimpleProxyNodeFactory();