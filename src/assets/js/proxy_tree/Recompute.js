import {createCustomProxy, reactiveReflectGet, useShouldExcludeProperty} from "@pt/proxy_utils/ProxyUtils.js";
import {computed, isRef, reactive, ref, watch, watchSyncEffect} from "vue";
import {isEmpty} from "@pt/proxy_utils/Utils.js";

function createStateProxy(state, rDeps, path = null) {
    const proxy = {value: null};

    proxy.value = createCustomProxy(state, {
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
    let checkDependenciesForDirty;
    let recomputeWatcher;

    const checkDep = (d) => {
        const t = d.target;
        const res = t[d.prop];
        if (isRef(res)) return res.value;
        return res;
    }

    const initCheckDependencies = () => {

        const deps = rDependencies.value;
        if (!isEmpty(deps)) {
            let initial = true;
            let rCheckDependencies = computed(() => {
                console.debug("Recomputing dirty via dependencies...");
                console.debug(`Dependencies: ${Object.keys(deps).join(',')}`);
                console.debug(`Initial: ${initial}`);
                Object.values(deps).forEach(d => checkDep(d));
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

        const prevDirty = dirty.value;
        checkDependenciesForDirty();
        if (dirty.value) {
            if (prevDirty !== dirty) {
                const depKeys = Object.keys(rDependencies.value);
                let depsStr;
                if (!depKeys.length) depsStr = "(None)";
                else depsStr = depKeys.join(',');
                console.debug(`dirty after depsCheck. Dependencies: ${depsStr}`);
            }
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