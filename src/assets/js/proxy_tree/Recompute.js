import {useShouldExcludeProperty} from "../ProxyUtils.js";
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

export function useRecompute(state, root, recomputeFn, markOverlaysDirtyFn, resetRootFn) {

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

    const resetDirty = () => {
        console.log("Resetting dirty");
        dirty.value = false;
    }
    const markDirty = () => {

        console.log("Hallo");
        dirty.value = true;
    }

    // If dirty was marked explicitly, this watch should take care of updates
    // If the recompute did not happen via access.
    watch(reactiveDirty, (dirty) => {
        if (!dirty.value) return;
        recomputeIfDirty()
    });

    initCheckDependencies(); // Initial dependency tracking enabled
    recomputeIfDirty();

    return {
        recomputeIfDirty,
        markDirty,
        isDirtyObj: dirty,
        isRecomputingObj: isRecomputing
    }
}