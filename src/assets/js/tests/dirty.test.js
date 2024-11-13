import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";
import {createTree} from "./TreeUtil.js";


describe('', () => {

    let srcTree, cTree;
    beforeEach(() => {
        srcTree = new SourceTree().init(createTree(0));
        cTree = new ComputedTree(srcTree, {}, (_, __) => undefined);
        expect(srcTree.root.isDirty).toBe(false);
        expect(cTree.root.isDirty).toBe(false);
    })

    test('Name change src', () => {
        srcTree.root.name = "Changed";
        expect(srcTree.root.dirty.name).toBe(false);
        expect(cTree.root.name).toBe(srcTree.root.name);
        expect(cTree.root.dirty.name).toBe(false);
    });

    test('Name change ov', () => {
        cTree.root.name = "Changed";
        expect(cTree.root.isDirty).toBe(true);
        expect(cTree.root.dirty.name).toBe(true);
        expect(cTree.root.name).toBe("Changed");
        expect(srcTree.root.name).not.toBe("Changed");
        console.log(srcTree.root.name);
        expect(cTree.root.prev.name).toBe(srcTree.root.name);
        expect(srcTree.root.dirty.name).toBe(false);
        expect(srcTree.root.isDirty).toBe(false);
    });

    xtest('Name change ov: sync with source', () => {
        cTree.root.name.value = "Changed";
        cTree.syncSrc();
        expect(cTree.root.dirty).toBe(false);
        expect(cTree.root.name.dirty).toBe(false);
        expect(srcTree.root.name.value).toBe("Changed");
    });
})