import {SourceTree} from "../proxy_tree/SrcTree.js";
import * as ProxyNodeErrors from "../proxy_tree/ProxyNodeErrors.js";


describe('Deletion', () => {

    let srcTree;
    beforeEach(() => {
        srcTree = new SourceTree().init({name: "Root", children: [{name: "Child 1"}]});
        expect(srcTree.root.stale).toBe(false);
    });

    test('Stale proxy', () => {

        srcTree.root.delete();
        expect(srcTree.root.stale).toBe(true);
        expect(() => srcTree.root.id).toThrow(ProxyNodeErrors.StaleProxyError);
    });

    test('Parent remove child relation', () => {

        const child = srcTree.root.children.get.first;
        const childId = child.id;
        expect(srcTree.root.children.has(childId)).toBe(true);
        child.delete();
        // expect(srcTree.root.children.has(childId)).toBe(false);

    });
});