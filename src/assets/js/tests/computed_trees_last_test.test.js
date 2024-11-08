import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ref} from "vue";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";

test('Hello', () => {
    const srcTree = new SourceTree().init({name: "Root"});

    let rCount = ref(0);
    let triggered = 0;
    let nameCount = 100;
    const computeFn = (root) => {
        console.log(nameCount);
        // root.name;
        // root.weight = rCount.value;
        // root.name = `Andere naam: ${nameCount--}`;
    };

    const compTree = new ComputedTree(srcTree, computeFn);
    compTree.root.name;
})
