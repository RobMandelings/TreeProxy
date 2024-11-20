import {computed, isReactive, isRef, ref} from "vue";

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
    let hasRecomputed = false;
    const effect = computed(() => {
        fallbackRef.value;
        effectFn();
        hasRecomputed = true;
    });

    const run = () => {
        hasRecomputed = false;
        effect.value;
        return hasRecomputed;
    }

    return run;
}

function checkDeps(deps) {
    deps.forEach(d => {
        const res = d.target[d.prop];
        if (!isRef(res) && !isReactive(d.target))
            throw new Error(`Cannot check dependency '${d.prop}': 
            target is not reactive target.prop is not a ref`);

        if (isRef(res)) return res;
        return res;
    });
}

export function trackDependencies(deps) {

    const effect = computedEffect(() => checkDeps(deps))
    const dependenciesChanged = () => effect();

    return dependenciesChanged;
}