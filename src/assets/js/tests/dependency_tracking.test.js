import {trackDependencies} from "@pt/utils/computedEffect.js";
import {nextTick, ref, watch} from "vue";

test('Track dependencies', () => {

    const depTracker = trackDependencies([]);
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