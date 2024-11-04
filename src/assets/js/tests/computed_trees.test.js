import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";

describe('ComputedTree', () => {
    let srcTree, compTree;

    const initial = "Root";
    const change1 = "Changed";
    const change2 = "Changed2";

    beforeEach(() => {
        srcTree = new SourceTree().init({name: initial});
        compTree = new ComputedTree(srcTree);
    });

    test('Equivalence to src tree', () => {
        // Although the node's data should be the same at this point, the proxies are different
        // This allows for copy-on-write mechanisms
        expect(compTree.root).not.toBe(srcTree.root);
        expect(compTree.root.id).toBe(srcTree.root.id);
        expect(compTree.root.name).toBe(srcTree.root.name);
    })

    test('Name change', () => {
        compTree.root.name = change1;
        expect(compTree.root.name).toBe(change1);
        expect(srcTree.root.name).not.toBe(change1);
    });

    test('Multi-layered change', () => {
        const compTree2 = new ComputedTree(compTree);
        compTree.root.name = change1;
        expect(compTree.root.name).toBe(change1);
        expect(compTree2.root.name).toBe(change1);
        compTree2.root.name = change2;
        expect(compTree2.root.name).toBe(change2);
        expect(compTree.root.name).toBe(change1);
        expect(srcTree.root.name).toBe(initial);
    });

    test('Children adjustments', () => {

    });
})