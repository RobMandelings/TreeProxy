import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";
import {CustomNode} from "../CustomNode.js";
import {createTree} from "./TreeUtil.js";

describe('ComputedTree', () => {
    let srcTree, ovTree;

    const initial = "Root";
    const change1 = "Changed";
    const change2 = "Changed2";

    let copySpy;
    beforeEach(() => {
        copySpy = jest.spyOn(CustomNode.prototype, 'copy');
    })

    describe('Simple tree', () => {
        beforeEach(() => {
            srcTree = new SourceTree().init({name: initial});
            ovTree = new ComputedTree(srcTree);
        });

        test('Equivalence to src tree', () => {
            // Although the node's data should be the same at this point, the proxies are different
            // This allows for copy-on-write mechanisms
            expect(ovTree.root).not.toBe(srcTree.root);
            expect(ovTree.root.id).toBe(srcTree.root.id);
            expect(ovTree.root.name).toBe(srcTree.root.name);
        });

        test('Name change', () => {
            ovTree.root.name = change1;
            expect(ovTree.root.name).toBe(change1);
            expect(srcTree.root.name).not.toBe(change1);
            expect(copySpy).toBeCalledTimes(1);
            copySpy.mockRestore()
        });

        xtest('Multi-layered change', () => {
            const compTree2 = new ComputedTree(ovTree);
            ovTree.root.name = change1;
            expect(ovTree.root.name).toBe(change1);
            expect(compTree2.root.name).toBe(change1);
            compTree2.root.name = change2;
            expect(compTree2.root.name).toBe(change2);
            expect(ovTree.root.name).toBe(change1);
            expect(srcTree.root.name).toBe(initial);
        });

        test('Children adjustments', () => {

        });
    });

    describe('Complex tree', () => {
        const getAdjustedNode = (tree) => tree.children[0].children[0];

        beforeEach(() => {
            srcTree = new SourceTree().init(createTree([[0, 0], 0, 0]));
            ovTree = new ComputedTree(srcTree);
        });

        test('Name change', () => {
            const srcNode = getAdjustedNode(srcTree.root);
            const ovNode = getAdjustedNode(ovTree.root);
            ovNode.name = change1;
            expect(srcNode.name).not.toBe(change1);
            expect(ovNode.name).toBe(change1);
            expect(ovNode.parent.id).toBe(srcNode.parent.id);
            expect(copySpy).toBeCalledTimes(1);
        });
    });
})