import {trackDependencies} from "@pt/utils/computedEffect.js";
import {ref} from "vue";

test('Track dependencies', () => {

    const depTracker = trackDependencies([]);
    expect(depTracker.hasDirtyDeps()).toBe(false);

});


describe('Single dirty dep', () => {

    let rCount, state, dep;
    beforeEach(() => {
        rCount = ref(null);
        state = {
            count: rCount
        }

        dep = {
            target: state,
            prop: "count"
        }
    });

    test('Has dirty', () => {


        const depTracker = trackDependencies([dep]);
        expect(depTracker.hasDirtyDeps()).toBe(false);
        rCount.value++;
        expect(depTracker.hasDirtyDeps()).toBe(true);

    });

    test('Remains dirty after check', () => {

        const depTracker = trackDependencies([dep]);
        expect(depTracker.hasDirtyDeps()).toBe(false);
        rCount.value++;
        expect(depTracker.hasDirtyDeps()).toBe(true);
        expect(depTracker.hasDirtyDeps()).toBe(true);

    })

    test('Remains dirty after check', () => {

        const depTracker = trackDependencies([dep]);
        expect(depTracker.hasDirtyDeps()).toBe(false);
        rCount.value++;
        expect(depTracker.hasDirtyDeps()).toBe(true);
        depTracker.resetDirtyDeps();
        expect(depTracker.hasDirtyDeps()).toBe(false);

    })
});