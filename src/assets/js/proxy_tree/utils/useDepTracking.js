import {computed, isReactive, isRef, ref, watch} from "vue";

/**
 * Creates a function that only re-runs whenever one of the dependencies have changed.
 * This function will probably not be of much use outside this file, but it is useful for the track dependencies.
 */
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
 *
 * Vue does not provide a built-in way to see whether dependencies have changed. I have made use of computed properties
 *   to hack this system a bit.
 * A computed property recomputes each time any of it's dependency change. Dependencies within computed properties are
 *   registered by simply making calls to reactive variables within that computed property
 *
 * E.g. rCount = ref(0);
 * const comp = computed(() => rCount.value). Because rCount.value was called inside the computed property, it is regarded as a dependency for that computed prop.
 * So if rCount.value changes, say rCount.value = 5, and we access the computed property, then it will recompute. We can use this to our advantage
 * By setting a variable 'dirty' to true whenever the computed property re-runs. This way, when we do comp.value, it is set to dirty if it has re-run. We can then simply query for the dirty property to see whether any of the dependencies have changed
 * And act accordingly. This is what happens when
 *
 * TODO 1: deep tracking of a reactive dependency: all properties within that dependency and all nested levels of that property should be tracked deeply as well.
 * It would be great if you could do useDepTracking(reactiveDep) and see whether anything in that reactive object has changed, and act accordingly.
 */
export function useDepTracking(depsArray) {

    const hasDirtyDeps = ref(false);
    const effect = computedEffect((initial) => {
        console.log("Effect function called");
        checkDeps(depsArray)
        if (!initial) hasDirtyDeps.value = true;
    });

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