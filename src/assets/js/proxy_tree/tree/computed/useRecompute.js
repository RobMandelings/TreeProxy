import {createCustomProxy, reactiveReflectGet} from "@pt/proxy_utils/ProxyUtils.js";
import {isReactive, isRef, reactive, ref, toRefs, watch} from "vue";
import {useDepTracking} from "@pt/utils/useDepTracking.js";

function createStateProxy(state, rDeps, path = null) {
    const proxy = {value: null};

    const refsState = isReactive(state) ? toRefs(state) : state;

    proxy.value = createCustomProxy(refsState, {
        get(target, prop, receiver) {
            const res = reactiveReflectGet(state, prop, receiver);
            if (typeof res === 'object' && res != null) return createStateProxy(res, rDeps, `${path}.${prop}`);
            else {
                const newPath = path ? `${path}.${prop}` : prop;

                // These access properties are tracked, so that they can be used to re-trigger
                // Any recomputations that need to happen
                if (!(newPath in rDeps.value)) rDeps.value[newPath] = {target, prop, receiver};
                return res;
            }
        },
    }, {name: "StateProxy", path, __rDeps__: rDeps});
    return proxy.value;
}

function useDependencyTracker(state) {
    let rDependencies = {value: {}};
    const stateProxy = createStateProxy(state, rDependencies);
    const clearDependencies = () => rDependencies.value = {};
    return {stateProxy, rDependencies, clearDependencies};

}

export function useRecompute(state, root, recomputeFn, markOverlaysDirtyFn, resetRootFn, recomputeSrcFn) {

    const {stateProxy, rDependencies, clearDependencies} = useDependencyTracker(state);
    recomputeFn = recomputeFn ?? ((_) => undefined);

    let isRecomputing = {value: false};
    let dirty = {value: true};
    let reactiveDirty = reactive(dirty);
    let rDepTracker = ref(null);
    let recomputeWatcher;

    const checkDep = (d) => {
        const t = d.target;
        const res = t[d.prop];
        if (isRef(res)) return res.value;
        return res;
    }

    const initCheckDependencies = () => {

        const depsArray = Object.values(rDependencies.value);
        rDepTracker.value = useDepTracking(depsArray);

    }

    /**
     * If dependency changes but there is no explicit call to one of the nodes, recomputeIfDirty is not called.
     * This is because reactivity works differently in the recomputed tree. Suppose compTree.root.name is shown
     * on the page. Then having a changed dependency will make sure that checkDependenciesForDirty() will re-evaluate
     * and set the dirty flag. However, vue has no way of knowing that compTree.root.name depends on it, so it will not refresh.
     * Therefore recomputeIfDirty will not be called.
     *
     * Making an explicit call e.g. compTree.root.name will trigger recomputeIfDirty earlier, because we always want the tree
     * to reflect the latest update. In this case we don't need the watcher to recompute the tree.
     *
     * This watcher will perform a single call if any of the dependencies have changed to recompute the tree.
     *
     */
    const initRecomputeWatcher = () => {
        if (recomputeWatcher) recomputeWatcher();
        recomputeWatcher = watch(Object.values(rDependencies.value).map(d => () => checkDep(d)), () => recomputeIfDirty());
    }

    const recompute = () => {

        if (recomputeSrcFn) recomputeSrcFn(); // First recompute the layer on which this layer depends

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
        if (rDepTracker.value.hasDirtyDeps()) {
            dirty.value = true;
            rDepTracker.value.resetDirtyDeps();
        }

        if (dirty.value) {
            recompute();
            return true;
        }
    }

    const resetDirty = () => {
        dirty.value = false;
    }
    const markDirty = () => {
        reactiveDirty.value = true;
        markOverlaysDirtyFn(); // All overlays should become dirty as well
    }

    // If dirty was marked explicitly, this watch should take care of updates
    // Recomputation also happens on access, but in case that didn't happen we still want the recompute to happen.
    // E.g. srcTree.root.name = "Changed", then if
    watch(reactiveDirty, (dirty) => {
        if (!dirty.value) return;
        recomputeIfDirty()
    });

    initCheckDependencies(); // Initial dependency tracking enabled
    recomputeIfDirty(); // Initial computation. Helps with tracking updates as well.

    return {
        recomputeIfDirty,
        markDirty,
        rDepTracker,
        isDirtyObj: dirty,
        isRecomputingObj: isRecomputing
    }
}