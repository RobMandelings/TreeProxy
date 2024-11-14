import {useShouldExcludeProperty} from "./proxy_utils/ProxyUtils.js";
import {computed, reactive, watch} from "vue";

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

export function useRecompute(state, root, recomputeFn, markOverlaysDirtyFn, resetRootFn, recomputeSrcFn) {

    const {stateProxy, dependencies, clearDependencies} = useDependencyTracker(state);
    recomputeFn = recomputeFn ?? ((_) => undefined);

    let isRecomputing = {value: false};
    let dirty = {value: true};
    let reactiveDirty = reactive(dirty);
    let checkDependenciesForDirty;
    let recomputeWatcher;

    const checkDep = (d) => Reflect.get(d.target, d.prop, d.receiver)

    const initCheckDependencies = () => {

        if (dependencies.length) {
            let initial = true;
            let rCheckDependencies = computed(() => {
                dependencies.forEach(d => checkDep(d));
                if (initial) initial = false;
                else dirty.value = true;
            });

            rCheckDependencies.value;

            checkDependenciesForDirty = () => rCheckDependencies.value;
        } else checkDependenciesForDirty = () => undefined; // There are no dependencies to check, so we don't create a computed prop
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
        recomputeWatcher = watch(dependencies.map(d => () => checkDep(d)), () => recomputeIfDirty());
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

        checkDependenciesForDirty();
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
        isDirtyObj: dirty,
        isRecomputingObj: isRecomputing
    }
}