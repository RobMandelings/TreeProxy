import {SourceTree} from "../proxy_tree/SrcTree.js";
import * as ProxyNodeErrors from "../proxy_tree/ProxyNodeErrors.js";


describe('Deletion', () => {

    let srcTree;
    beforeEach(() => {
        srcTree = new SourceTree().init({name: "Root", children: [{name: "Child 1"}]});
        expect(srcTree.root.stale).toBe(false);
    });

    xtest('Stale proxy', () => {

        srcTree.root.delete();
        expect(srcTree.root.stale).toBe(true);
        expect(() => srcTree.root.id).toThrow(ProxyNodeErrors.StaleProxyError);
    });

    test('Parent remove child relation', () => {

        const child = srcTree.root.children[0];
        const id = child.id; // Need to capture id before it becomes stale
        expect(srcTree.root.children[id]).toBeTruthy();
        child.delete();
        expect(srcTree.root.children[0]).toBeFalsy();

        // expect(srcTree.root.children.has(childId)).toBe(false);

    });
});