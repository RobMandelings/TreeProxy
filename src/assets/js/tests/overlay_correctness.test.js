import {createComputedTree, createSourceTree} from "@/SimpleProxyTreeBuilders.js";
import {createTree} from "@pt/TreeUtil.js";

describe('Removing change if same as src', () => {
    let srcTree, compTree;
    beforeEach(() => {
        srcTree = createSourceTree({name: "Root"});
        compTree = createComputedTree(srcTree, (_, __) => undefined);
    });

    test('', () => {
        compTree.root.name = "Changed";
        expect(compTree.nodeMap.elementChanges.size).toBe(1);
        compTree.root.name = "Root";
        expect(compTree.nodeMap.elementChanges.size).toBe(0);
    });
});