import {computed, isReactive, isRef, ref, watch} from "vue";

export function computedEffect(effectFn) {

    /**
     * When a computed property does not access any reactive values or refs
     * Computed properties behave very weirdly, leading to the effect being recomputed many times
     * Even though nothing has changed. In order to debug effectively, we'll make sure that
     * The effect is only triggered initially when the computed prop has no reactive dependencies.
     *
     * This helps to observe that the computed effect is not set-up properly
     */
    const fallbackRef = ref(null);

    /**
     * Initial is required to trigger the computed effect at least once, such that all dependencies
     * can be tracked. Once any of the reactive dependencies in the effect change, the computed effect will run again
     */
    let initial = true;
    const effect = computed(() => {
        fallbackRef.value;
        effectFn(initial);
        if (initial) initial = false;
    });

    const run = () => effect.value;

    run(); // Initial effect to start the dependency tracking (much like how watchEffect works)

    return run;
}

function checkDeps(deps) {
    deps.forEach(d => {
        const res = d.target[d.prop];
        if (!isRef(res) && !isReactive(d.target))
            throw new Error(`Cannot check dependency '${d.prop}': 
            target is not reactive target.prop is not a ref`);

        if (isRef(res)) return res.value;
        return res;
    });
}

/**
 * Function to help track reactive vue dependencies. Used for creating custom computed properties that are more sophisticated
 * than the built-in computed props. E.g. for computed trees.
 *
 * Also used to check whether the tree should execute its recompute function.
 */
export function trackDependencies(depsArray) {

    const hasDirtyDeps = ref(false);
    const effect = computedEffect((initial) => {
        console.log("Effect function called");
        checkDeps(depsArray)
        if (!initial) hasDirtyDeps.value = true;
    })

    /**
     * Sets hasDirtyDeps to true if the effect was recomputed.
     *
     */
    const hasDirtyDepsFn = () => {
        console.debug("Has dirty dependencies called");
        effect(); // Run the effect. If the effect is re-run once, hasDirtyDeps is set to true
        return hasDirtyDeps.value;
    }

    const resetDirtyDeps = () => hasDirtyDeps.value = false;

    return {hasDirtyDeps: hasDirtyDepsFn, resetDirtyDeps};
}