import {nextTick, watch} from "vue";
import {CustomNode} from "../CustomNode.js";
import * as Proxies from "../proxy_tree/RefProxy.js";
import {SourceTree} from "../proxy_tree/SrcTree.js";
import * as ProxyNodeErrors from "../proxy_tree/ProxyNodeErrors.js"
import * as ProxyTreeErrors from "../proxy_tree/ProxyTreeErrors.js"

test('First test of computed tree', () => {
    const srcTree = new SourceTree();
    const rootId = srcTree.addTree({
        name: "Root",
        children: [{name: "Banaan", children: [{name: "Superbanaan"}]}, {name: "Appel"}]
    });
    const root2Id = srcTree.addTree({name: "Baviano"});
    srcTree.init(rootId);
    // console.warn(srcTree.root.descendants.map(d => d.name));
    // console.warn(srcTree.root.children[0].children[0].ancestors.map(a => a.name));
    // expect(srcTree.root.children).toBe('Root');
    // expect(srcTree.root.children[0].parent).toBe("Hello");
});

test('Root not initialised', () => {
    const srcTree = new SourceTree();
    const rootId = srcTree.addTree({name: "Root"});
    expect(() => srcTree.root).toThrow(ProxyTreeErrors.RootNotSetError);
    srcTree.init(rootId)
    expect(() => srcTree.root).not.toBeNull();
})

test('Direct proxy node access', () => {
    const srcTree = new SourceTree();
    const rootId = srcTree.addTree({name: "Root", children: [{name: "Child 1"}]});
    srcTree.init(rootId);

    expect(() => srcTree.root.node).toThrow(ProxyNodeErrors.DirectNodeAccessError);
});

describe('Stale proxies', () => {

    let srcTree;
    beforeEach(() => {
        srcTree = new SourceTree();
        const rootId = srcTree.addTree({name: "Root", children: [{name: "Child 1"}]});
        srcTree.init(rootId);
        expect(srcTree.root.stale).toBe(false);
        srcTree.root.delete();
        expect(srcTree.root.stale).toBe(true);
    });

    test('Stale proxy error', () => {
        expect(() => srcTree.root.id).toThrow(ProxyNodeErrors.StaleProxyError);
    });
});


describe('Parent and Child relation', () => {
    const srcTree = new SourceTree();
    srcTree.addTreeAndSetRoot({name: "Root", children: [{name: "Child"}]});
    const child = srcTree.root.children[0];
    test('Parent relation test', () => expect(child.parent).toBe(srcTree.root));
    test('Child instance via parent equal to child instance', () => expect(child.parent.children[0]).toBe(child));
});

// xdescribe("Deep watch on source tree", () => {
//
//     let srcTree, sourceNodeMap, child, mockCallback, initialChildName;
//
//     beforeEach(() => {
//         initialChildName = 'Child';
//         const result = Proxies.createSourceTree(new CustomNode('Root'));
//         srcTree = result.srcTree;
//         sourceNodeMap = result.sourceNodeMap;
//         const childId = sourceNodeMap.addNode(new CustomNode(initialChildName));
//         srcTree.childrenIds = [childId];
//         child = srcTree.children[0];
//
//         mockCallback = jest.fn();
//         watch(srcTree, () => mockCallback());
//     })
//
//     test('Test initial child name change', async () => {
//         child.name = "Changed";
//         await nextTick();
//         expect(mockCallback).toHaveBeenCalledTimes(1);
//     });
//
//     test('Assign with no change', async () => {
//         child.name = initialChildName;
//         await nextTick();
//         expect(mockCallback).toHaveBeenCalledTimes(0);
//     })
//
//     test('Many changes', async () => {
//         let count = 0;
//         const nrChanges = 5;
//         for (let i = 0; i < nrChanges; i++) {
//             child.name = `${count++}`;
//             await nextTick();
//         }
//         expect(mockCallback).toHaveBeenCalledTimes(nrChanges);
//     })
// })