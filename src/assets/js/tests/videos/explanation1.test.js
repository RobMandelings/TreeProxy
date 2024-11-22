import {createComputedTree, createSourceTree} from "@/SimpleProxyTreeBuilders.js";
import {createEmptyCompTree} from "@/tests/trees.js";
import {ref} from "vue";

let srcTree, compTree;
beforeEach(() => {
    srcTree = createSourceTree({name: "Root", children: [{name: "Child A"}]});
    const createCompTree = createEmptyCompTree(srcTree);
    compTree = createCompTree.compTree;
})

test('', () => {
    compTree.root.name = "Hallo";
    srcTree.root.name = "Root2";

    const srcChild = srcTree.root.children[0];
    const compChild = srcTree.root.children[1]
})

test('', () => {

    const computeFn = (state, root) => {
        root.name = `Root ${state.count}`;
    }

    const rCount = ref(0);
    const state = {
        count: rCount,
    }

    const compTree = createComputedTree(srcTree, computeFn, state);
    console.log(compTree.root.name);
    rCount.value++;
    console.log(compTree.root.name);
    rCount.value++;
    console.log(compTree.root.name);
    
})