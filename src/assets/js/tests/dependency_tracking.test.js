import {computedEffect, useDepTracking} from "@pt/utils/useDepTracking.js";
import {nextTick, reactive, ref, watch} from "vue";

const resetDirty = (depTracker) => {
    depTracker.resetDirtyDeps();
    expect(depTracker.hasDirtyDeps()).toBe(false);
}

test('Track dependencies: no dependencies', () => {

    const rCount = ref(0);
    const depTracker = useDepTracking([]);
    expect(depTracker.hasDirtyDeps()).toBe(false);
    // For some reason if a computed property does not access any reactive props, it becomes dirty after any ref changes
    // Changing the count should not  trigger any hasDirtyDeps to be true (see fallbackRef)
    rCount.value++;
    expect(depTracker.hasDirtyDeps()).toBe(false);

});


describe('Single dirty dep', () => {

    let rCount, state, dep, depTracker;
    beforeEach(() => {
        rCount = ref(null);
        state = {
            count: rCount
        }

        dep = {
            target: state,
            prop: "count"
        }
        depTracker = useDepTracking([dep]);
        expect(depTracker.hasDirtyDeps()).toBe(false);
    });

    test('Has dirty', () => {

        rCount.value++;
        expect(depTracker.hasDirtyDeps()).toBe(true);

    });

    test('Remains dirty after check', () => {

        rCount.value++;
        expect(depTracker.hasDirtyDeps()).toBe(true);
        expect(depTracker.hasDirtyDeps()).toBe(true);

    })

    test('Remains dirty after check', () => {

        rCount.value++;
        expect(depTracker.hasDirtyDeps()).toBe(true);
        depTracker.resetDirtyDeps();
        expect(depTracker.hasDirtyDeps()).toBe(false);
        expect(depTracker.hasDirtyDeps()).toBe(false); // Still false after second access
        rCount.value++;
        expect(depTracker.hasDirtyDeps()).toBe(true);
        expect(depTracker.hasDirtyDeps()).toBe(true);


    })

    test('Watch on hasDirtyDeps', async () => {

        const watchTrigger = jest.fn();
        watch(() => depTracker.hasDirtyDeps(), () => watchTrigger());
        expect(depTracker.hasDirtyDeps()).toBe(false);
        rCount.value++;
        await nextTick()
        expect(depTracker.hasDirtyDeps()).toBe(true);
        expect(watchTrigger).toBeCalledTimes(1);

    })
});

test('ComputedEffect', async () => {

    const rCount = ref(0);

    const trigger = jest.fn();
    const runEffect = computedEffect(() => {
        rCount.value;
        trigger();
    });
    expect(trigger).toBeCalledTimes(1);
    trigger.mockClear();
    expect(trigger).toBeCalledTimes(0);

    rCount.value++;
    expect(trigger).toBeCalledTimes(0); // Not accessed yet
    runEffect();
    expect(trigger).toBeCalledTimes(1);

})

test('Watch on hasDirtyDeps', async () => {

    let rCount, state, dep, depTracker;
    rCount = ref(null);
    state = {
        count: rCount
    }

    dep = {
        target: state,
        prop: "count"
    }
    depTracker = useDepTracking([dep]);
    const watchTrigger = jest.fn(() => console.log("hello"));
    watch(() => depTracker.hasDirtyDeps(), () => watchTrigger());
    rCount.value++;
    await nextTick();
    expect(depTracker.hasDirtyDeps()).toBe(true);
    expect(watchTrigger).toBeCalledTimes(1);

})

test('Dep tracking on ref', () => {

    const rCount = ref(0);
    const depTracker = useDepTracking(rCount);
    expect(depTracker.hasDirtyDeps()).toBe(false);
    rCount.value++;
    expect(depTracker.hasDirtyDeps()).toBe(true);

})

test('Deep dependency tracking on regular object', () => {

    const throwingDepTracker = () => useDepTracking({});
    expect(throwingDepTracker).toThrow();
})

test('Deep dependency tracking on reactive object', () => {

    const dep = reactive({
        a: 0,
        b: {
            bA: 0,
            bB: ref(0),
        }
    });

    const depTracker = useDepTracking(dep);
    expect(depTracker.hasDirtyDeps()).toBe(false);
    dep.a = 5;
    expect(depTracker.hasDirtyDeps()).toBe(true);
    resetDirty(depTracker);
    dep.b.bA = 5;
    expect(depTracker.hasDirtyDeps()).toBe(true);
    resetDirty(depTracker);
    dep.b.bB = 10;
    expect(depTracker.hasDirtyDeps()).toBe(true);

})