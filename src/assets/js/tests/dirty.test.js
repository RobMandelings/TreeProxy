import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";


xdescribe('', () => {

    let srcTree, ovTree;
    beforeEach(() => {
        srcTree = new SourceTree().init(0);
        ovTree = new ComputedTree(srcTree);
        expect(srcTree.root.dirty).toBe(false);
        expect(ovTree.root.dirty).toBe(false);
    })

    test('Name change src', () => {
        srcTree.root.name.value = "Changed";
        expect(srcTree.root.name.dirty).toBe(false);
        expect(ovTree.root.name.value).toBe(srcTree.root.name.value);
        expect(ovTree.root.name.dirty).toBe(false);
    });

    test('Name change ov', () => {
        ovTree.root.name.value = "Changed";
        expect(ovTree.root.dirty).toBe(true);
        expect(ovTree.root.name.dirty).toBe(true);
        expect(srcTree.root.name.value).not.toBe("Changed");
        expect(srcTree.root.name.dirty).toBe(false);
        expect(srcTree.root.dirty).toBe(false);
    });

    test('Name change ov: sync with source', () => {
        ovTree.root.name.value = "Changed";
        ovTree.syncSrc();
        expect(ovTree.root.dirty).toBe(false);
        expect(ovTree.root.name.dirty).toBe(false);
        expect(srcTree.root.name.value).toBe("Changed");
    });
})