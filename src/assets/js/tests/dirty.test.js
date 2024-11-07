import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";


xdescribe('', () => {

    let srcTree, cTree;
    beforeEach(() => {
        srcTree = new SourceTree().init(0);
        cTree = new ComputedTree(srcTree);
        expect(srcTree.root.dirty).toBe(false);
        expect(cTree.root.dirty).toBe(false);
    })

    test('Name change src', () => {
        srcTree.root.name.value = "Changed";
        expect(srcTree.root.name.dirty).toBe(false);
        expect(cTree.root.name.value).toBe(srcTree.root.name.value);
        expect(cTree.root.name.dirty).toBe(false);
    });

    test('Name change ov', () => {
        cTree.root.name.value = "Changed";
        expect(cTree.root.dirty).toBe(true);
        expect(cTree.root.name.dirty).toBe(true);
        expect(srcTree.root.name.value).not.toBe("Changed");
        expect(srcTree.root.name.dirty).toBe(false);
        expect(srcTree.root.dirty).toBe(false);
    });

    test('Name change ov: sync with source', () => {
        cTree.root.name.value = "Changed";
        cTree.syncSrc();
        expect(cTree.root.dirty).toBe(false);
        expect(cTree.root.name.dirty).toBe(false);
        expect(srcTree.root.name.value).toBe("Changed");
    });
})