import {ProxyTree} from "./ProxyTree.js";
import {OverlayNodeMap} from "../node_map/OverlayNodeMap.js";
import {computed, isRef, reactive, ref, toRaw, watch} from "vue";
import {createComputedProxyNode} from "./ProxyNode.js";
import {useShouldExcludeProperty} from "../ProxyUtils.js";

function createStateProxy(state, deps) {
    const excludePropFn = useShouldExcludeProperty(state);
    return new Proxy(state, {
        get(target, prop, receiver) {
            if (excludePropFn(prop)) return Reflect.get(target, prop, receiver);

            const res = Reflect.get(target, prop, receiver);
            if (typeof res === 'object') return createStateProxy(res, deps);
            else {
                // These access properties are tracked, so that they can be used to re-trigger
                // Any recomputations that need to happen
                deps.push({target, prop, receiver});
                return res;
            }
        },
    });
}

function useDependencyTracker(state) {
    state = reactive(state); // Need to make reactive for computed prop to work
    let dependencies = [];
    const stateProxy = createStateProxy(state, dependencies);
    const clearDependencies = () => dependencies.length = 0;
    return {stateProxy, dependencies, clearDependencies};

}

function useRecompute(state, root, recomputeFn, markOverlaysDirtyFn, resetRootFn) {

    const {stateProxy, dependencies, clearDependencies} = useDependencyTracker(state);
    recomputeFn = recomputeFn ?? ((_) => undefined);

    let isRecomputing = {value: false};
    let dirty = {value: true};
    let reactiveDirty = reactive(dirty);
    let rCheckDependencies;
    let recomputeWatcher;

    const checkDep = (d) => Reflect.get(d.target, d.prop, d.receiver)

    const initCheckDependencies = () => {
        let initial = true;
        rCheckDependencies = computed(() => {
            dependencies.forEach(d => checkDep(d));
            if (initial) initial = false;
            else dirty.value = true;
        });

        rCheckDependencies.value;
    }

    /**
     * If dependency changes but there is no explicit call to one of the nodes, recomputeIfDirty is not called
     * This watcher will perform a single call if any of the dependencies have changed to see whether a
     * recomputation should happen
     */
    const initRecomputeWatcher = () => {
        if (recomputeWatcher) recomputeWatcher();
        recomputeWatcher = watch(dependencies.map(d => () => checkDep(d)), () => recomputeIfDirty());
    }

    const checkDirtyDependencies = () => {
        if (!rCheckDependencies)
            throw new Error("Can't check for dirty dependencies: not initialised.")
        rCheckDependencies.value;
    }

    const recompute = () => {
        isRecomputing.value = true;
        resetRootFn();
        clearDependencies();
        recomputeFn(stateProxy, root);
        resetDirty();
        initCheckDependencies();
        initRecomputeWatcher();
        isRecomputing.value = false;

        markOverlaysDirtyFn(); // Computed trees that depend on this tree need to recompute
    }

    const recomputeIfDirty = () => {
        if (isRecomputing.value) return false;

        checkDirtyDependencies();
        if (dirty.value) {
            recompute();
            return true;
        }
    }

    const resetDirty = () => dirty.value = false;
    const markDirty = () => {
        reactiveDirty.value = true;
    }

    // If dirty was marked explicitly, this watch should take care of updates
    // If the recompute did not happen via access.
    watch(reactiveDirty, (dirty) => {
        if (!dirty.value) return;
        recomputeIfDirty()
    });

    initCheckDependencies(); // Initial dependency tracking enabled

    return {
        recomputeIfDirty,
        markDirty,
        isRecomputingObj: isRecomputing
    }
}

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

                if (prop !== 'isRecomputing' && prop !== "_root") {
                    this.recomputeIfDirty();
                }

                return Reflect.get(target, prop, receiver);
            },
            set: (target, prop, value, receiver) => {
                const result = Reflect.set(target, prop, value, receiver);
                if (result) this.markDirty();
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