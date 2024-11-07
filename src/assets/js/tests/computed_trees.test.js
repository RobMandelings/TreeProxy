import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";
import {CustomNode} from "../CustomNode.js";
import {createTree} from "./TreeUtil.js";
import {nextTick} from "vue";

function createRecomputeSpy() {
    const originalMethod = ComputedTree.prototype.recompute;

    let recomputeSpy = jest.fn();
    jest.spyOn(ComputedTree.prototype, 'recompute').mockImplementation(function (...args) {
        if (!this.isRecomputing) recomputeSpy();
        originalMethod.apply(this, args);
    });

    return recomputeSpy;
}

describe('ComputedTree', () => {
    let srcTree, compTree;

    const initial = "Root";
    const change1 = "Changed";
    const change2 = "Changed2";

    let copySpy;
    let recomputeSpy;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        copySpy = jest.spyOn(CustomNode.prototype, 'copy');
        recomputeSpy = createRecomputeSpy();
    })

    describe('Simple tree', () => {
        beforeEach(() => {
            srcTree = new SourceTree().init({name: initial});
            compTree = new ComputedTree(srcTree, (_) => undefined);
            expect(srcTree.computedTreeOverlays.length).not.toBeFalsy();
        });

        test('Change to src tree', () => {
            expect(compTree.shouldRecompute).toBe(false);
            srcTree.root.name = "Changed1";
            expect(compTree.shouldRecompute).toBe(true);
            expect(compTree.isRecomputing).toBe(false);

            // Simply querying for whether the tree should be recomputed should not trigger
            // Recomputation
            expect(recomputeSpy).toBeCalledTimes(1); // Initial recomputation always happens
            expect(compTree.root.name).toBe(srcTree.root.name)
            expect(compTree.shouldRecompute).toBe(false);
            srcTree.root.name = "Changed2";
            expect(compTree.shouldRecompute).toBe(true) // Another change is made to the src tree, so the layer above should be re-evaluated
            expect(compTree.root.name).toBe(srcTree.root.name);
            expect(recomputeSpy).toBeCalledTimes(3);
        });

        test('Equivalence to src tree', () => {
            // Although the node's data should be the same at this point, the proxies are different
            // This allows for copy-on-write mechanisms
            expect(compTree.root).not.toBe(srcTree.root);
            expect(compTree.root.id).toBe(srcTree.root.id);
            expect(compTree.root.name).toBe(srcTree.root.name);
        });

        test('Name change', () => {
            compTree.root.name = change1;
            expect(compTree.root.name).toBe(change1);
            expect(srcTree.root.name).toBe(initial);
            expect(copySpy).toBeCalledTimes(1);
            compTree.root.name = change2;
            expect(compTree.root.name).toBe(change2);
            expect(srcTree.root.name).toBe(initial);
            expect(copySpy).toBeCalledTimes(1);
        });

        test('Children adjustments', () => {

        });

        test('Clear on recompute', () => {
            const initialWeight = srcTree.root.weight;
            const nxtWeight = initialWeight + 1;
            compTree.root.weight = nxtWeight;
            expect(compTree.root.weight).toBe(nxtWeight);
            expect(srcTree.root.weight).toBe(initialWeight);
            srcTree.root.name = change1;
            expect(compTree.root.weight).toBe(initialWeight);
            expect(compTree.root.name).toBe(change1);
        });

        test('Recompute weight', () => {
            const initWeight = srcTree.root.weight;
            const nxtWeight = initWeight + 1;
            recomputeSpy.mockClear();
            const compTree2 = new ComputedTree(srcTree, (root) => {
                root.weight = nxtWeight;
                console.log("Recomputed");
            });
            expect(recomputeSpy).toBeCalledTimes(1);
            expect(compTree2.root.weight).toBe(nxtWeight);
            srcTree.root.name = change1;
            expect(compTree2.root.name).toBe(change1);
            expect(recomputeSpy).toBeCalledTimes(2);
            expect(srcTree.root.weight).toBe(initWeight);
            expect(compTree2.root.weight).toBe(nxtWeight);
        });
    });

    describe('Complex tree', () => {
        const getAdjustedNode = (tree) => tree.children[0].children[0];

        beforeEach(() => {
            srcTree = new SourceTree().init(createTree([[0, 0], 0, 0]));
            compTree = new ComputedTree(srcTree);
        });

        test('Name change', () => {

            const srcNode = getAdjustedNode(srcTree.root);
            const ovNode = getAdjustedNode(compTree.root);
            ovNode.name = change1;
            expect(srcNode.name).not.toBe(change1);
            expect(ovNode.name).toBe(change1);
            expect(ovNode.parent.id).toBe(srcNode.parent.id);
            expect(copySpy).toBeCalledTimes(1);
        });
    });
})