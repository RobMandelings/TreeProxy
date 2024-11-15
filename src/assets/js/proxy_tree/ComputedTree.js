import {ProxyTree} from "@pt/ProxyTree.js";
import {OverlayRefStore} from "@pt/node_map/OverlayRefStore.js";
import {reactive} from "vue";
import {useShouldExcludeProperty} from "@pt/proxy_utils/ProxyUtils.js";
import {useRecompute} from "@pt/Recompute.js";

const excludedPropsCompTree = new Set(["_root", "isRecomputing", "_isRecomputingObj", "markDirty", "recomputeIfDirty", "markedForRecompute", "_isDirtyObj"]);
const checkDirtyForProp = (prop) => !excludedPropsCompTree.has(prop);

export class ComputedTree extends ProxyTree {

    constructor(srcTree,
                state,
                recomputeFn,
                proxyNodeFactory) {
        let overlayRefStore = reactive(new OverlayRefStore(srcTree.nodeMap));
        super(overlayRefStore, proxyNodeFactory);
        this.overlayRefStore = overlayRefStore;
        this.srcTree = srcTree;
        this.srcTree.addComputedTreeOverlay(this);
        this.initRootId(srcTree.root.id);

        const {recomputeIfDirty, isRecomputingObj, isDirtyObj, markDirty} =
            useRecompute(
                state,
                this.root,
                recomputeFn,
                () => this.markOverlaysDirty(),
                () => this.overlayRefStore.clearAllChanges(),
                () => srcTree.recomputeIfDirty ? srcTree.recomputeIfDirty() : undefined
            );

        this.recomputeIfDirty = recomputeIfDirty;
        this._isRecomputingObj = isRecomputingObj;
        this._isDirtyObj = isDirtyObj;
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

    getSrcNode(id) {
        return this.srcTree.getElement(id);
    }

    get markedForRecompute() {
        return this._isDirtyObj.value;
    }

    get isRecomputing() {
        return this._isRecomputingObj.value;
    }

    createProxyNodeFn(id, parentId) {
        return this.proxyNodeFactory.createComputedProxyNode(this, id, parentId);
    }

    getOverwrittenNodes() {
        return this.overlayRefStore.getOverwrittenNodeIds().map(id => this.getElement(id));
    }

    getAddedNodes() {
        return this.overlayRefStore.getAddedNodeIds().map(id => this.getElement(id));
    }

    getDeletedNodes() {
        return this.overlayRefStore.getDeletedNodeIds();
    }
}