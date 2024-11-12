import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";
import {CustomNode} from "../CustomNode.js";
import {createTree} from "./TreeUtil.js";
import {nextTick, ref} from "vue";


describe('ComputedTree', () => {
    let srcTree, compTree;

    const initial = "Root";
    const change1 = "Changed";
    const change2 = "Changed2";

    let copySpy;
    let recomputeFn;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        copySpy = jest.spyOn(CustomNode.prototype, 'copy');
    })

    describe('Simple tree', () => {
        beforeEach(() => {
            srcTree = new SourceTree().init({name: initial});
        });

        describe('ComputedTree core: no computed values', () => {

            let rCount;
            const initialCount = 0;
            const resetCount = () => rCount.value = initialCount;

            beforeEach(() => {
                recomputeFn = jest.fn((state, __) => state.count);
                rCount = ref(initialCount);
                compTree = new ComputedTree(srcTree, {count: rCount}, recomputeFn);
                expect(srcTree.computedTreeOverlays.length).not.toBeFalsy();
                expect(recomputeFn).toBeCalledTimes(1);
                recomputeFn.mockClear();
            });

            afterEach(() => resetCount());

            test('Recompute on access', () => {
                rCount.value++;
                expect(recomputeFn).toBeCalledTimes(0);
                compTree.root;
                expect(recomputeFn).toBeCalledTimes(1);
            });

            test('Recompute automatically', async () => {
                rCount.value++;
                expect(recomputeFn).toBeCalledTimes(0);
                await nextTick();
                expect(recomputeFn).toBeCalledTimes(1);
            });

            test('Change to src tree', () => {
                srcTree.root.name = "Changed1";
                expect(compTree.markedForRecompute).toBe(true);
                expect(compTree.isRecomputing).toBe(false);

                // Simply querying for whether the tree should be recomputed should not trigger
                // Recomputation
                expect(recomputeFn).toBeCalledTimes(0);
                expect(compTree.root.name).toBe(srcTree.root.name)
                expect(compTree.markedForRecompute).toBe(false);
                srcTree.root.name = "Changed2";
                expect(compTree.markedForRecompute).toBe(true) // Another change is made to the src tree, so the layer above should be re-evaluated
                expect(compTree.root.name).toBe(srcTree.root.name);
                expect(recomputeFn).toBeCalledTimes(2);
            });

            test('Equivalence to src tree', () => {
                // Although the node's data should be the same at this point, the proxies are different
                // This allows for copy-on-write mechanisms
                expect(compTree.root).not.toBe(srcTree.root);
                expect(compTree.root.id).toBe(srcTree.root.id);
                expect(compTree.root.name).toBe(srcTree.root.name);
            });

            test('Manual name change', () => {
                compTree.root.name = change1;
                expect(compTree.root.name).toBe(change1);
                expect(srcTree.root.name).toBe(initial);
                expect(copySpy).toBeCalledTimes(1);
                compTree.root.name = change2;
                expect(compTree.root.name).toBe(change2);
                expect(srcTree.root.name).toBe(initial);
                expect(copySpy).toBeCalledTimes(1);
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
        });

        describe('Computed tree: adjustments', () => {

            const getCompWeight = () => srcTree.root.weight + 5;

            beforeEach(() => {
                recomputeFn = jest.fn((state, root) => root.weight = getCompWeight());
                compTree = new ComputedTree(srcTree, {}, recomputeFn);
            });

            test('SRC tree name adjustment', async () => {
                expect(compTree.root.weight).toBe(getCompWeight());
                expect(recomputeFn).toBeCalledTimes(1);
                expect(copySpy).toBeCalledTimes(1);
                srcTree.root.name = change1;
                expect(copySpy).toBeCalledTimes(1); // No recomputation has happened yet
                compTree.root.name; // We access the changed node to trigger recomputations
                expect(recomputeFn).toBeCalledTimes(2); // Should be recomputed due to access
                expect(copySpy).toBeCalledTimes(2); // The src node was adjusted, so a new copy was made

                expect(compTree.root.name).toBe(change1); // The name reflects the name from the adjusted src tree
                expect(compTree.root.weight).toBe(getCompWeight()); // The weight reflects the computed weight
            });

            test('SRC tree weight adjustment', () => {
                expect(compTree.root.weight).toBe(getCompWeight());
                // When the source tree weight changes, the recomputed weight should be reflecting the change
                srcTree.root.weight += 15;
                expect(compTree.root.weight).toBe(getCompWeight());
            });
        });
    });

    describe('Complex tree', () => {
        const getAdjustedNode = (tree) => tree.children[0].children[0];

        beforeEach(() => {
            srcTree = new SourceTree().init(createTree([[0, 0], 0, 0]));
            compTree = new ComputedTree(srcTree, {}, (_, __) => undefined);
        });

        test('Name change', () => {

            const srcNode = getAdjustedNode(srcTree.root);
            const ovNode = getAdjustedNode(compTree.root);
            ovNode.name = change1;
            copySpy.mockClear();
            expect(srcNode.name).not.toBe(change1);
            expect(ovNode.name).toBe(change1);
            expect(ovNode.parent.id).toBe(srcNode.parent.id);
            expect(copySpy).toBeCalledTimes(1);
        });
    });
})