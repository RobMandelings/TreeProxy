import {useRecompute} from "@pt/Recompute.js";
import {ref} from "vue";

test('Hello', () => {

    const rCount = ref(0);
    const state = {
        count: rCount
    };
    const computeFn = (state, root) => {
        console.log(state.count);
        console.log("Hello");
    }

    const {rDepTracker} = useRecompute(state, null, computeFn, () => null, () => null, () => null);
    rCount.value++;
    expect(rDepTracker.value.hasDirtyDeps()).toBe(true);
    // console.log(rDepTracker.value.hasDirtyDeps());

})