import {ProxyTree} from "./ProxyTree.js";
import {OverlayNodeMap} from "../node_map/OverlayNodeMap.js";
import {computed, reactive, watch, watchSyncEffect} from "vue";
import {createComputedProxyNode, createSrcProxyNode} from "./ProxyNode.js";

export class ComputedTree extends ProxyTree {

    constructor(srcTree, recomputeFn) {
        let overlayNodeMap = reactive(new OverlayNodeMap(srcTree.nodeMap));
        super(overlayNodeMap);
        this.overlayNodeMap = overlayNodeMap;
        this.shouldRecompute = false;
        this.isRecomputing = false;
        this.srcTree = srcTree;
        this.srcTree.addComputedTreeOverlay(this);
        this.recomputeFn = recomputeFn ?? ((_) => undefined);
        this.initRootId(srcTree.root.id);
        this.flagForRecompute();

        watchSyncEffect(() => this.recompute(true));

        // Return a proxied version of this instance
        return new Proxy(this, {


            get: (target, prop, receiver) => {
                if (prop !== 'shouldRecompute' && prop !== 'isRecomputing') {
                    if (target.shouldRecompute)
                        target.recompute();
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

    /**
     * Force property is used for e.g. when reactive dependency inside the recomputeFn is called.
     * Otherwise 'shouldRecompute' simply returns the function and no recomputation is made.
     * TODO check at a later time whether this is a nice approach.
     * @param force
     */
    recompute(force = false) {
        console.log("Recomputing");
        if (this.isRecomputing) return;
        if (!this.shouldRecompute && !force) return;

        this.isRecomputing = true;
        this.overlayNodeMap.clearAllChanges();
        this.recomputeFn(this.root);
        this.computedTreeOverlays.forEach(t => t.flagForRecompute());
        this.isRecomputing = false;
        this.shouldRecompute = false;
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