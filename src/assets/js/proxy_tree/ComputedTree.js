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
                // These access properties are tracked, so that they can be put
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

    const rIsRecomputing = ref(false);
    let dirty = true;
    let rCheckDependencies;
    let recomputeWatcher;

    const checkDep = (d) => Reflect.get(d.target, d.prop, d.receiver)

    const initCheckDependencies = () => {
        let initial = true;
        rCheckDependencies = computed(() => {
            dependencies.forEach(d => checkDep(d));
            if (initial) initial = false;
            else dirty = true;
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

    const resetDirty = () => dirty = false;

    const checkDirtyDependencies = () => {
        if (!rCheckDependencies)
            throw new Error("Can't check for dirty dependencies: not initialised.")
        rCheckDependencies.value;
    }

    const recompute = () => {
        rIsRecomputing.value = true;
        resetRootFn();
        clearDependencies();
        recomputeFn(stateProxy, root);
        resetDirty();
        initCheckDependencies();
        initRecomputeWatcher();
        rIsRecomputing.value = false;

        markOverlaysDirtyFn(); // Computed trees that depend on this tree need to recompute
    }

    const recomputeIfDirty = () => {
        if (rIsRecomputing.value) return;

        checkDirtyDependencies();
        if (dirty) recompute();
    }

    const markDirty = () => dirty = true;

    initCheckDependencies(); // Initial dependency tracking enabled

    return {
        recomputeIfDirty,
        markDirty,
        rIsRecomputing
    }
}

export class ComputedTree extends ProxyTree {

    constructor(srcTree, state, recomputeFn) {
        let overlayNodeMap = reactive(new OverlayNodeMap(srcTree.nodeMap));
        super(overlayNodeMap);
        this.overlayNodeMap = overlayNodeMap;
        this.isRecomputing = false;
        this.srcTree = srcTree;
        this.srcTree.addComputedTreeOverlay(this);
        this.initRootId(srcTree.root.id);

        const {recomputeIfDirty, rIsRecomputing, markDirty} =
            useRecompute(
                state,
                this.root,
                recomputeFn,
                () => this.markOverlaysDirty(),
                () => this.overlayNodeMap.clearAllChanges()
            );

        this.recomputeIfDirty = recomputeIfDirty;
        this.rIsRecomputing = rIsRecomputing;
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
                if (prop !== 'isRecomputing')
                    this.markDirty();
                return result;
            }
        });
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