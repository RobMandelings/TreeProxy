import {ProxyTree} from "./ProxyTree.js";
import {OverlayNodeMap} from "../node_map/OverlayNodeMap.js";
import {reactive} from "vue";
import {createComputedProxyNode, createSrcProxyNode} from "./ProxyNode.js";

export class ComputedTree extends ProxyTree {

    constructor(srcTree, recomputeFn) {
        let overlayNodeMap = reactive(new OverlayNodeMap(srcTree.nodeMap));
        super(overlayNodeMap);
        this.overlayNodeMap = overlayNodeMap;
        this.recomputeFn = recomputeFn ?? ((_) => undefined);
        this.shouldRecompute = false;
        this.isRecomputing = false;
        this.srcTree = srcTree;
        this.srcTree.addComputedTreeOverlay(this);
        this.initRootId(srcTree.root.id);
        this.flagForRecompute();

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

    recompute() {
        if (this.isRecomputing) return;
        if (!this.shouldRecompute) return;

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