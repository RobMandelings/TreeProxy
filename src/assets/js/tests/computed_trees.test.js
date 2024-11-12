import {SourceTree} from "../proxy_tree/SrcTree.js";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";
import {CustomNode} from "../CustomNode.js";
import {createTree} from "./TreeUtil.js";
import {nextTick, ref} from "vue";

const createEmptyCompTree = (srcTree) => {
    const computeFn = jest.fn((_, __) => undefined);
    const compTree = new ComputedTree(srcTree, {}, computeFn);
    return {compTree, computeFn};
}


const createSuffixCompTree = (srcTree, concat) => {
    return new ComputedTree(srcTree, {}, (_, root) => root.name += concat);
}

const createSimpleSourceTree = (rootName = "Root") => new SourceTree().init({name: rootName});

let copySpy = jest.spyOn(CustomNode.prototype, 'copy');
beforeEach(() => {
    jest.clearAllMocks();
})

describe('ComputedTree', () => {
    let srcTree, compTree;

    const initial = "Root";
    const change1 = "Changed";
    const change2 = "Changed2";

    let computeFn;

    describe('Simple tree', () => {
        beforeEach(() => {
            srcTree = new SourceTree().init({name: initial});
        });

        describe('ComputedTree core: no computed values', () => {

            let rCount;
            const initialCount = 0;
            const resetCount = () => rCount.value = initialCount;

            beforeEach(() => {
                computeFn = jest.fn((state, __) => state.count);
                rCount = ref(initialCount);
                compTree = new ComputedTree(srcTree, {count: rCount}, computeFn);
                expect(srcTree.computedTreeOverlays.length).not.toBeFalsy();
                expect(computeFn).toBeCalledTimes(1);
            });

            afterEach(() => resetCount());

            test('Recompute on access', () => {
                rCount.value++;
                expect(computeFn).toBeCalledTimes(1);
                compTree.root;
                expect(computeFn).toBeCalledTimes(2);
            });

            /*
            To make sure that even without explicit access on the node that triggers recomputation,
            the recomputation is will always be performed at the nextTick.
            This is because reactivity is handled slightly differently in computed trees, and vue does not know what
            properties are
             */
            test('Recompute on next tick', async () => {

                expect(computeFn).toBeCalledTimes(1)
                rCount.value++;
                expect(computeFn).toBeCalledTimes(1);
                await nextTick();
                expect(computeFn).toBeCalledTimes(2);
            });

            test('Change to src tree', () => {
                srcTree.root.name = "Changed1";
                expect(compTree.markedForRecompute).toBe(true);
                expect(compTree.isRecomputing).toBe(false);

                // Simply querying for whether the tree should be recomputed should not trigger
                // Recomputation
                expect(computeFn).toBeCalledTimes(1);
                expect(compTree.root.name).toBe(srcTree.root.name)
                expect(compTree.markedForRecompute).toBe(false);
                srcTree.root.name = "Changed2";
                expect(compTree.markedForRecompute).toBe(true) // Another change is made to the src tree, so the layer above should be re-evaluated
                expect(compTree.root.name).toBe(srcTree.root.name);
                expect(computeFn).toBeCalledTimes(3);
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
                computeFn = jest.fn((state, root) => root.weight = getCompWeight());
                compTree = new ComputedTree(srcTree, {}, computeFn);
            });

            test('SRC tree name adjustment', async () => {
                expect(compTree.root.weight).toBe(getCompWeight());
                expect(computeFn).toBeCalledTimes(1);
                expect(copySpy).toBeCalledTimes(1);
                srcTree.root.name = change1;
                expect(copySpy).toBeCalledTimes(1); // No recomputation has happened yet
                compTree.root.name; // We access the changed node to trigger recomputations
                expect(computeFn).toBeCalledTimes(2); // Should be recomputed due to access
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

describe('Computed tree state changes', () => {

    let srcTree, compTree;
    beforeEach(() => {
        srcTree = createSimpleSourceTree();
    });

    test('state.count change', () => {

        const srcTree = createSimpleSourceTree();
        const rCount = ref(0);
        const compTree = new ComputedTree(srcTree, {count: rCount}, (state, root) => state.count);

    });
})

describe('Computed tree behaviour on src change', () => {

    test('Source tree name change', () => {
        const srcTree = createSimpleSourceTree();
        const {compTree, computeFn} = createEmptyCompTree(srcTree);

        srcTree.root.name = "Changed";
        expect(compTree.root.name).toBe("Changed");
        expect(computeFn).toBeCalledTimes(2);
        expect(copySpy).toBeCalledTimes(0); // A name change in src should not trigger a copy, as the computed tree does not alter it.
    });

    test('', () => {
        const srcTree = createSimpleSourceTree();


        const computeFn = (_, root) => root.name += " (changed)";
        const compTree = new ComputedTree(srcTree, {}, computeFn);
        expect(compTree.root.name).toBe(srcTree.root.name + " (changed)");
        expect(copySpy).toBeCalledTimes(1);
        srcTree.root.name

    });

    /*
    This is required because vue might not reflect the changes in the computed tree. The computed tree
    immediately gets marked as dirty, but if srcTree.root.name isn't accessed explicitly afterwards, then it will not be re-evaluated.
    This leads to the computed version of the node to also not be re-evaluated.

    See what happens when markDirty is called in Recompute.js
     */
    test('Source tree name change. nextTick should trigger recompute', async () => {
        const srcTree = createSimpleSourceTree();
        const {compTree, computeFn} = createEmptyCompTree(srcTree);
        srcTree.root.name = "Changed";
        expect(computeFn).toBeCalledTimes(1);
        await nextTick();
        expect(computeFn).toBeCalledTimes(2);
    });
});

test('Shorthand name concatenation using src root', () => {

    const concatString = " (changed)";
    const srcTree = createSimpleSourceTree();
    const compTree = new ComputedTree(srcTree, {}, (_, root) => root.name += concatString);
    expect(compTree.root.name).toBe(srcTree.root.name + concatString);

})

test('Layers: previous layer remains unchanged', () => {

    const getLayerName = (root, layer) => `layer${layer}-${root.name}`;
    const layer0 = createSimpleSourceTree("layer0");
    const layer1 = new ComputedTree(layer0, {}, (_, root) => root.name = getLayerName(root, 1));
    const layer2 = new ComputedTree(layer1, {}, (_, root) => {
        root.name = getLayerName(root, 2)
    });
    const layer3 = new ComputedTree(layer2, {}, (_, root) => root.name = getLayerName(root, 3));

    const checkLayerNameConsistency = () => {
        expect(layer3.root.name).toBe(getLayerName(layer2.root, 3));
        expect(layer2.root.name).toBe(getLayerName(layer1.root, 2));
        expect(layer1.root.name).toBe(getLayerName(layer0.root, 1));
    }

    checkLayerNameConsistency();
    layer0.root.name = "Changed";
    checkLayerNameConsistency(); // Layer 0 has changed, all other layers should be recomputed.
});

