import {ProxyTree} from "./ProxyTree.js";
import {OverlayNodeMap} from "../node_map/OverlayNodeMap.js";
import {computed, isRef, reactive, ref, toRaw} from "vue";
import {createComputedProxyNode} from "./ProxyNode.js";
import {useShouldExcludeProperty} from "../ProxyUtils.js";

function createStateProxy(state, deps) {
    const excludePropFn = useShouldExcludeProperty(state);
    return new Proxy(state, {
        get(target, prop, receiver) {
            if (excludePropFn(prop)) return Reflect.get(target, prop, receiver);

            const res = Reflect.get(target, prop, receiver);
            if (typeof res === 'object') return createStateProxy(res, deps);
            else if (isRef(res)) {
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
    const resetDirty = () => {
        let initial = true;
        rCheckDependencies = computed(() => {
            dependencies.forEach(s => Reflect.get(s.target, s.prop, s.receiver));
            if (initial) initial = false;
            else dirty = true;
        });
        rCheckDependencies.value;
        dirty = false;
    }

    const checkDirtyDependencies = () => rCheckDependencies.value;

    const recompute = () => {
        rIsRecomputing.value = true;
        resetRootFn();
        clearDependencies();
        recomputeFn(stateProxy, root);
        resetDirty();
        rIsRecomputing.value = false;

        markOverlaysDirtyFn(); // Computed trees that depend on this tree need to recompute
    }

    const recomputeIfDirty = () => {

        if (rIsRecomputing.value) return;

        checkDirtyDependencies();
        if (dirty) recompute();
    }

    const markDirty = () => dirty = true;

    return {
        recomputeIfDirty,
        markDirty,
        rIsRecomputing
    }
}

export class ComputedTree extends ProxyTree {

    constructor(srcTree, recomputeFn) {
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
                () => this.flagOverlaysForRecompute(),
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