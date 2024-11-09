import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";
import {ref} from "vue";

test('Computed tree clearance', () => {

    const srcTree = new SourceTree().init({name: "Root"});

    const rCount = ref(0);
    const recomputeFn = (state, root) => {
        state.count;
    }
    const compTree = new ComputedTree(srcTree, {count: rCount}, recomputeFn);

    compTree.root.name = "Changed"; // Manually change a value
    rCount.value++; // This should trigger recompute and clear the adjustments
    expect(compTree.root.name).toBe("Changed");
})