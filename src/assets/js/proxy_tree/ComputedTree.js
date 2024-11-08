import {ProxyTree} from "./ProxyTree.js";
import {OverlayNodeMap} from "../node_map/OverlayNodeMap.js";
import {computed, reactive, toRaw, watch, watchSyncEffect} from "vue";
import {createComputedProxyNode, createSrcProxyNode} from "./ProxyNode.js";

/**
 * The cached recompute version requires a different reactive root
 * In order to break circular dependencies in the computed prop
 * Force is used for when the computed property re-evaluates
 */
function recompute(compTree, root, force = false) {
    if (compTree.isRecomputing) return;
    if (!compTree.shouldRecompute && !force) return;

    compTree.isRecomputing = true;
    compTree.overlayNodeMap.clearAllChanges();
    compTree.recomputeFn(root);
    compTree.computedTreeOverlays.forEach(t => t.flagForRecompute());
    compTree.isRecomputing = false;
    compTree.shouldRecompute = false;
}

export class ComputedTree extends ProxyTree {

    constructor(srcTree, recomputeFn) {
        let overlayNodeMap = reactive(new OverlayNodeMap(srcTree.nodeMap));
        super(overlayNodeMap);
        this.overlayNodeMap = overlayNodeMap;

        // Initialise flag of recompute to false, because the computed property has not been evaluated yet
        // Thus it will automatically recompute on first access
        this.shouldRecompute = false;
        this.isRecomputing = false;
        this.recomputeFn = recomputeFn ?? ((_) => undefined);
        this.srcTree = srcTree;
        this.srcTree.addComputedTreeOverlay(this);
        this.initRootId(srcTree.root.id);
        this.rRecompute = this.createCachedRecompute();

        // Return a proxied version of this instance
        return new Proxy(this, {


            get: (target, prop, receiver) => {
                if (prop !== 'shouldRecompute' && prop !== 'isRecomputing') {
                    if (target.shouldRecompute)
                        target.recompute();
                    else this.rRecompute.value;
                    // When recompute is not flagged explicitly, we still access the computed variable to trigger a recompute if any of the
                    // Dependencies in recomputeFn have changed
                }

                return Reflect.get(target, prop, receiver);
            },
            set: (target, prop, value, receiver) => {
                const result = Reflect.set(target, prop, value, receiver);
                if (prop !== 'shouldRecompute' && prop !== 'isRecomputing')
                    target.flagForRecompute();
                return result;
            }
        });
    }

    flagForRecompute() {
        this.shouldRecompute = true;
    }

    createProxyNodeFn(id, parentId) {
        return createComputedProxyNode(this, id, parentId);
    }

    createCachedRecompute() {
        // TODO find out why this works
        const root = reactive(toRaw(this.root)); // Small trick to break circular dependency chain
        return computed(() => recompute(this, root, true));
    }

    recompute() {
        recompute(this, this.root, false);
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