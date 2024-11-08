import {ProxyTree} from "./ProxyTree.js";
import {OverlayNodeMap} from "../node_map/OverlayNodeMap.js";
import {computed, effect, reactive, ref, toRaw, triggerRef, watch, watchSyncEffect} from "vue";
import {createComputedProxyNode, createSrcProxyNode} from "./ProxyNode.js";
import {isVueProperty} from "../ProxyUtils.js";

function createRootForRecompute(reactiveRoot) {

    const rawRoot = toRaw(reactiveRoot);
    return new Proxy({}, {
        get(t, p, receiver) {
            return Reflect.get(rawRoot, p, receiver);
        },
        set(t, p, newValue, receiver) {
            return Reflect.set(reactiveRoot, p, newValue, receiver);
        }
    });
}

/**
 * The cached recompute version requires a different reactive root
 * In order to break circular dependencies in the computed prop
 * Force is used for when the computed property re-evaluates
 */
function recompute(compTree, root) {
    if (compTree.isRecomputing) return;

    compTree.isRecomputing = true;
    compTree.overlayNodeMap.clearAllChanges();
    compTree.recomputeFn(root);
    compTree.computedTreeOverlays.forEach(t => t.flagForRecompute());
    compTree.isRecomputing = false;
    console.log("Set it to false");
}

export class ComputedTree extends ProxyTree {

    constructor(srcTree, recomputeFn) {
        let overlayNodeMap = reactive(new OverlayNodeMap(srcTree.nodeMap));
        super(overlayNodeMap);
        this.overlayNodeMap = overlayNodeMap;
        this.isRecomputing = false;
        this.recomputeFn = recomputeFn ?? ((_) => undefined);
        this.srcTree = srcTree;
        this.srcTree.addComputedTreeOverlay(this);
        this.initRootId(srcTree.root.id);

        this.rForcedRecomputes = ref(0);
        this.rRecompute = this.createCachedRecompute();

        // Return a proxied version of this instance
        return new Proxy(this, {

            get: (target, prop, receiver) => {
                if (isVueProperty(prop)) return Reflect.get(target, prop, receiver);

                if (prop !== 'rForcedRecomputes' && prop !== 'isRecomputing' && prop !== "_root") {
                    this.checkForRecompute();
                }

                return Reflect.get(target, prop, receiver);
            },
            set: (target, prop, value, receiver) => {
                const result = Reflect.set(target, prop, value, receiver);
                if (prop !== 'rForcedRecomputes' && prop !== 'isRecomputing')
                    target.flagForRecompute();
                return result;
            }
        });
    }

    checkForRecompute() {
        console.log("Heerlijk");
        if (!this.isRecomputing) this.rRecompute?.value;
        // When recompute is not flagged explicitly, we still access the computed variable to trigger a recompute if any of the
        // Dependencies in recomputeFn have changed
    }

    flagForRecompute() {
        this.rForcedRecomputes.value++;
    }

    createProxyNodeFn(id, parentId) {
        return createComputedProxyNode(this, id, parentId);
    }

    createCachedRecompute() {
        // TODO find out why this works
        const rootForRecompute = createRootForRecompute(this.root);
        return computed(() => {
            this.rForcedRecomputes.value; // Triggers a recomputation
            recompute(this, rootForRecompute);
        });
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