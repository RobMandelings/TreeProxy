import {computedEffect, trackDependencies} from "@pt/utils/computedEffect.js";
import {nextTick, ref, watch} from "vue";

test('Track dependencies', () => {

    const depTracker = trackDependencies([]);
    expect(depTracker.hasDirtyDeps()).toBe(false);

});

test('Computed effect: no dependencies', () => {

})


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
        depTracker = trackDependencies([dep]);
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
    depTracker = trackDependencies([dep]);
    const watchTrigger = jest.fn(() => console.log("hello"));
    watch(() => depTracker.hasDirtyDeps(), () => watchTrigger());
    rCount.value++;
    await nextTick();
    expect(depTracker.hasDirtyDeps()).toBe(true);
    expect(watchTrigger).toBeCalledTimes(1);

})