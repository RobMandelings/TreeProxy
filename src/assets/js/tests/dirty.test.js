import {SourceTree} from "../proxy_tree/SrcTree.js";
import {OverlayTree} from "../proxy_tree/OverlayTree.js";

describe('', () => {

    let srcTree, ovTree;
    beforeEach(() => {
        srcTree = new SourceTree().init(0);
        ovTree = new OverlayTree(srcTree);
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
})