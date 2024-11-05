import {SourceTree} from "../proxy_tree/SrcTree.js";
import * as ProxyNodeErrors from "../proxy_tree/ProxyNodeErrors.js";
import {createTree} from "./TreeUtil.js";


describe('Deletion', () => {

    let srcTree;
    beforeEach(() => {
        srcTree = new SourceTree().init({name: "Root", children: [{name: "Child 1"}]});
        expect(srcTree.root.stale).toBe(false);
    });

    test('Stale proxy', () => {

        const id = srcTree.root.id;
        expect(srcTree.nodeMap.getNode(id)).toBeTruthy();
        expect(srcTree.getNode(id)).toBeTruthy();
        srcTree.root.delete();
        expect(srcTree.root.stale).toBe(true);
        expect(() => srcTree.root.id).toThrow(ProxyNodeErrors.StaleProxyError);
        expect(srcTree.getNode(id)).toBeFalsy();
        expect(srcTree.nodeMap.getNode(id)).toBeFalsy();
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
    const srcTree = new SourceTree().init(createTree([1, 3, 1]));
    const nrDescendants1 = srcTree.root.descendants.size;
    const nrDeleted = srcTree.root.children[1].delete();
    expect(nrDeleted).toBe(4);
    expect(srcTree.root.descendants.size).toBe(nrDescendants1 - nrDeleted);

});