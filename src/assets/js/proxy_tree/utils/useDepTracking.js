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

function isValidDep(dep) {
    if (typeof dep === 'function'
        || dep instanceof Array
        || isRef(dep)
        || isReactive(dep)
        || (typeof dep === "object" && ("target" in dep && "prop" in dep))) return true;
    return false;
}

/**
 * Recursively checks dependencies. By calling properties on the reactive dependencies, these properties are marked
 * as a 'dependency' for a given computed property. Computed properties are then recomputed when any of these dependencies change
 * In this way, we can use the re-computation function of a computed property to mark any of the properties as dirty.
 * If a property did not become dirty since the last reset, then the computed property did not re-evaluate and did not set the dirty flag to true
 */
function checkDep(dep) {
    if (!isValidDep(dep)) throw new Error(`Cannot check dependency '${dep}': 
    invalid dependency. Type: ${typeof dep}. It must be a reactive object, ref, getter function, or array
     (or perhaps others that are not mentioned here)`);

    if (typeof dep === 'function') dep();
    else if (dep instanceof Array) dep.forEach(d => isValidDep(dep) && checkDep(d));
    else if (isRef(dep)) return dep.value;
    else if (isReactive(dep)) {
        Object.values(dep).forEach(d => isValidDep(d) && checkDep(d))
    } else if ("target" in dep && "prop" in dep) {
        const res = dep.target[dep.prop];
        if (!isRef(res) && !isReactive(dep.target))
            throw new Error(`Cannot check dependency '${dep.prop}': 
            target is not reactive or target.prop is not a ref`);

        if (isRef(res)) return res.value;
        return res;
    } else throw new Error(`Cannot track dependency: incorrect type ${typeof dep}`);
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
 *
 * param dep: could be a getter function, a reactive object, a ref, or array of deps.
 */
export function useDepTracking(dep) {

    const hasDirtyDeps = ref(false);
    const effect = computedEffect((initial) => {
        checkDep(dep);
        if (!initial) hasDirtyDeps.value = true;
    });

    /**
     * Sets hasDirtyDeps to true if the effect was recomputed.
     *
     */
    const hasDirtyDepsFn = () => {
        effect(); // Run the effect. If the effect is re-run once, hasDirtyDeps is set to true
        return hasDirtyDeps.value;
    }

    const resetDirtyDeps = () => hasDirtyDeps.value = false;

    return {hasDirtyDeps: hasDirtyDepsFn, resetDirtyDeps};
}