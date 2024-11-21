import {createComputedTree, createSourceTree} from "@/SimpleProxyTreeBuilders.js";
import {createEmptyCompTree} from "@/tests/trees.js";

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
