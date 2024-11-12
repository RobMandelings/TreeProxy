import {ProxyTree} from "./ProxyTree.js";
import {OverlayNodeMap} from "../node_map/OverlayNodeMap.js";
import {computed, isRef, reactive, ref, toRaw, watch} from "vue";
import {createComputedProxyNode} from "./ProxyNode.js";
import {useShouldExcludeProperty} from "../ProxyUtils.js";
import {useRecompute} from "./Recompute.js";

const excludedPropsCompTree = new Set(["_root", "isRecomputing", "markDirty", "recomputeIfDirty"]);
const checkDirtyForProp = (prop) => !excludedPropsCompTree.has(prop);

export class ComputedTree extends ProxyTree {

    constructor(srcTree, state, recomputeFn) {
        let overlayNodeMap = reactive(new OverlayNodeMap(srcTree.nodeMap));
        super(overlayNodeMap);
        this.overlayNodeMap = overlayNodeMap;
        this.srcTree = srcTree;
        this.srcTree.addComputedTreeOverlay(this);
        this.initRootId(srcTree.root.id);

        const {recomputeIfDirty, isRecomputingObj, markDirty} =
            useRecompute(
                state,
                this.root,
                recomputeFn,
                () => this.markOverlaysDirty(),
                () => this.overlayNodeMap.clearAllChanges()
            );

        this.recomputeIfDirty = recomputeIfDirty;
        this._isRecomputingObj = isRecomputingObj;
        this.markDirty = markDirty;

        const excludePropFn = useShouldExcludeProperty(this);
        // Return a proxied version of this instance
        return new Proxy(this, {

            get: (target, prop, receiver) => {
                excludePropFn(prop);
                if (checkDirtyForProp(prop)) this.recomputeIfDirty();
                return Reflect.get(target, prop, receiver);
            },
            set: (target, prop, value, receiver) => {
                const result = Reflect.set(target, prop, value, receiver);
                if (checkDirtyForProp(prop) && result) this.markDirty();
                return result;
            }
        });
    }

    isRecomputing() {
        return this._isRecomputingObj.value;
    }

    createProxyNodeFn(id, parentId) {
        return createComputedProxyNode(this, id, parentId);
    }

    getOverwrittenNodes() {
        return this.overlayNodeMap.getOverwrittenNodeIds().map(id => this.getNode(id));
    }

    getAddedNodes() {
        return this.overlayNodeMap.getAddedNodeIds().map(id => this.getNode(id));
    }

    getDeletedNodes() {
        return this.overlayNodeMap.getDeletedNodeIds();
    }
}