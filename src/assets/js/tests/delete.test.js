import * as ProxyNodeErrors from "@pt/tree_node/ProxyNodeErrors.js";
import {createTree} from "@pt/utils/TreeUtil.js";
import {createSourceTree} from "@/SimpleProxyTreeBuilders.js";


describe('Deletion', () => {

    let srcTree;
    beforeEach(() => {
        srcTree = createSourceTree({name: "Root", children: [{name: "Child 1"}]});
        expect(srcTree.root.stale).toBe(false);
    });

    test('Stale proxy', () => {

        const id = srcTree.root.id;
        expect(srcTree.nodeMap.getElement(id)).toBeTruthy();
        expect(srcTree.getElement(id)).toBeTruthy();
        srcTree.root.delete();
        expect(srcTree.root.stale).toBe(true);
        expect(() => srcTree.root.id).toThrow(ProxyNodeErrors.StaleProxyError);
        expect(srcTree.getElement(id)).toBeFalsy();
        expect(srcTree.nodeMap.getElement(id)).toBeFalsy();
    });

    test('Parent remove child relation', () => {

        const child = srcTree.root.children[0];
        const id = child.id; // Need to capture id before it becomes stale
        expect(srcTree.root.children[id]).toBeTruthy();
        child.delete();
        expect(srcTree.root.children[id]).toBeFalsy();
        expect(child.stale).toBeTruthy();
    });
});

test('Delete many at once check', () => {
    const srcTree = createSourceTree(createTree([0, 3, 0]));
    const nrDescendants1 = srcTree.root.descendants.size;
    const nrDeleted = srcTree.root.children[1].delete();
    srcTree.getChildren(srcTree.root.id);
    expect(nrDeleted).toBe(4);
    expect(srcTree.root.descendants.size).toBe(nrDescendants1 - nrDeleted);
    expect(srcTree.root.children.size).toBe(2);
});