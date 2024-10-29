import {nextTick, watch} from "vue";
import {CustomNode} from "../CustomNode.js";
import * as Proxies from "../proxy_tree/RefProxy.js";
import {SourceTree} from "../proxy_tree/SrcTree.js";

test('First test of computed tree', () => {
    const srcTree = new SourceTree();
    const rootId = srcTree.addTree({name: "Root", children: [{name: "Banaan"}]});
    srcTree.init(rootId);
    expect(srcTree.root.children).toBe('Root');
    // expect(srcTree.root.children[0].parent).toBe("Hello");
});


// xdescribe('Parent and Child relation', () => {
//     const {srcTree, sourceNodeMap} = Proxies.createSourceTree(new CustomNode('Root'));
//     const childId = sourceNodeMap.addNode(new CustomNode('Child 2'));
//     srcTree.childrenIds = [childId];
//     const child = srcTree.children[0];
//     console.log(srcTree.children);
//
//     test('Child id test', () => expect(child.id).toBe(childId));
//     test('Parent relation test', () => expect(child.parent).toBe(srcTree));
//     test('Child instance via parent equal to child instance', () => expect(child.parent.children[0]).toBe(child));
// })

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