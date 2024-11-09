import {ProxyTree} from "./ProxyTree.js";
import {OverlayNodeMap} from "../node_map/OverlayNodeMap.js";
import {computed, isRef, reactive, ref, toRaw} from "vue";
import {createComputedProxyNode} from "./ProxyNode.js";
import {useShouldExcludeProperty} from "../ProxyUtils.js";

function createStateProxy(state, stateAccess) {
    const excludePropFn = useShouldExcludeProperty(state);
    return new Proxy(state, {
        get(target, prop, receiver) {
            if (excludePropFn(prop)) return Reflect.get(target, prop, receiver);

            const res = Reflect.get(target, prop, receiver);
            if (typeof res === 'object') return createStateProxy(res, stateAccess);
            else if (isRef(res)) {
                // These access properties are tracked, so that they can be put
                stateAccess.push({target, prop, receiver});
                return res;
            }
        },
    });
}

function useStateTracker(state) {
    state = reactive(state); // Need to make reactive for computed prop to work
    let stateAccess = [];
    const stateProxy = createStateProxy(state, stateAccess);
    const clearState = () => stateAccess.length = 0;
    return {stateProxy, stateAccess, clearState};

}

function useRecompute(state, root, recomputeFn, flagOverlaysForRecomputeFn, resetRootFn) {

    const {stateProxy, stateAccess, clearState} = useStateTracker(state);

    const rIsRecomputing = ref(false);
    let dirty = true;
    let rSetDirty;
    const resetDirty = () => {
        let initial = true;
        rSetDirty = computed(() => {
            stateAccess.forEach(s => Reflect.get(s.target, s.prop, s.receiver));
            if (initial) initial = false;
            else dirty = true;
        });
        rSetDirty.value;
        dirty = false;
    }

    const setDirtyFlag = () => rSetDirty.value;

    const recompute = () => {
        rIsRecomputing.value = true;
        resetRootFn();
        clearState();
        recomputeFn(stateProxy, root);
        resetDirty();
        rIsRecomputing.value = false;

        flagOverlaysForRecomputeFn(); // Computed trees that depend on this tree need to recompute
    }

    const recomputeIfDirty = () => {

        if (rIsRecomputing.value) return;

        setDirtyFlag();
        if (dirty) recompute();
    }

    return {
        forceRecompute: recompute,
        recomputeIfDirty,
        rIsRecomputing
    }
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

        const excludePropFn = useShouldExcludeProperty(this);
        // Return a proxied version of this instance
        return new Proxy(this, {

            get: (target, prop, receiver) => {
                excludePropFn(prop);

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