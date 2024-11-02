import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";

describe('ComputedTree', () => {
    let srcTree, compTree;

    beforeEach(() => {
        srcTree = new SourceTree().init({name: "Root"});
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
        compTree.root.name = "Changed";
        expect(compTree.root.name).toBe("Changed");
        expect(srcTree.root.name).not.toBe("Changed");
    });

    test('Multi-layered change', () => {
        const compTree2 = new ComputedTree(compTree);
        compTree.root.name = "Changed";
        expect(compTree.root.name).toBe("Changed");
        expect(compTree2.root.name).toBe("Changed");
        compTree2.root.name = "Changed2";
        expect(compTree2.root.name).toBe("Changed2");
        expect(compTree.root.name).not.toBe("Changed2")
        expect(srcTree.root.name).not.toBe("Changed2")
    });

    test('Children adjustments', () => {

    });
})