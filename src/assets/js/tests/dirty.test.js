import {ComputedTree} from "@pt/tree/computed/ComputedTree.js";
import {createTree} from "@pt/utils/TreeUtil.js";
import {createEmptyCompTree} from "./trees.js";
import {OverlayType} from "@pt/ref_store/OverlayType.js";
import {CustomNode} from "@pt/nodes/CustomNode.js";
import {createComputedTree, createSourceTree} from "@/SimpleProxyTreeBuilders.js";


describe('', () => {

    let srcTree, cTree;
    beforeEach(() => {
        srcTree = createSourceTree(createTree(0));
        cTree = createComputedTree(srcTree, (_, __) => undefined);
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
});

test('Overlay tree: move child', () => {

    const srcTree = createSourceTree(createTree([1, 0]));
    const compTree = createComputedTree(srcTree, (_, __) => undefined);
    const srcRoot = srcTree.root;
    const compRoot = compTree.root;

    const cChild1 = compRoot.children[0];
    const cChild2 = compRoot.children[1];
    const cSubChild = cChild1.children[0];

    expect(cSubChild.parent.id).toBe(cChild1.id);
    cSubChild.setParent(cChild2.id);

    expect(cSubChild.parent.id).toBe(cChild2.id);
    expect(cSubChild.prev.parent.id).toBe(cChild1.id);
    expect(cSubChild.dirty.parent).toBe(true);
    expect(cChild1.dirty.childrenIds).toBe(true);
    expect(cChild2.dirty.childrenIds).toBe(true);
    expect(cChild1.children.has(cSubChild.id)).toBe(false);
    expect(cChild1.prev.children.has(cSubChild.id)).toBe(true);
    expect(cChild2.children.has(cSubChild.id)).toBe(true);
    expect(cChild2.prev.children.has(cSubChild.id)).toBe(false);
});

describe('Add children', () => {

    test('Add single node to root', () => {

        const srcTree = createSourceTree(createTree(0));
        const cTree = createEmptyCompTree(srcTree).compTree;
        const cRoot = cTree.root;
        const id = cRoot.addChild(new CustomNode("Child", 1), 0);
        // TODO add to the end by default
        // TODO add entire tree structure and add an array of nodes / tree structures
        //  (might be able to reuse some tree creation logic)

        expect(cRoot.children.has(id)).toBe(true);
        expect(cRoot.children[id].overlayType).toBe(OverlayType.ADDED);
        expect(cRoot.prev.children.has(id)).toBe(false);
    });
});

test('Delete subtree', () => {

    const srcTree = createSourceTree(createTree([5])); // Root has 1 child that has 5 children
    const cTree = createEmptyCompTree(srcTree).compTree;
    expect(srcTree.root.descendants.size).toBe(6);
    const srcChild = srcTree.root.children[0];
    const cChild = cTree.root.children[0];
    cChild.delete();
    expect(cChild.stale).toBe(true);
    expect(srcChild.stale).toBe(false);
    expect(srcTree.root.descendants.size).toBe(6)
    expect(cTree.root.descendants.size).toBe(0);

});