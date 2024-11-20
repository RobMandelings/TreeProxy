import {computed, isReactive, nextTick, reactive, ref, watch} from "vue";
import {ComputedTree} from "@pt/ComputedTree.js";
import {createComputedTree, createSourceTree} from "@/SimpleProxyTreeBuilders.js";

function runWatchTests(description, getTarget, watchTriggers) {
}

describe("Deep watch", () => {

    let srcTree, child, initialName

    let rootWatchTrigger, childrenWatchTrigger;
    rootWatchTrigger = jest.fn();
    childrenWatchTrigger = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
        initialName = 'Child';
        srcTree = createSourceTree({name: 'Root', children: [{name: initialName}]});
        child = srcTree.root.children[0];
        expect(child).not.toBeFalsy();
    })

    describe('Source tree', () => {

        beforeEach(() => {
            watch(() => srcTree.root.children.asArray, () => childrenWatchTrigger());
            watch(() => srcTree.root.name, () => rootWatchTrigger());
        });

        describe('Root level watch', () => {
            let target;
            beforeEach(() => {
                target = srcTree.root;
            });

            test('No change', async () => {
                expect(target.name).toBe(target.name);
                await nextTick();
                expect(rootWatchTrigger).toHaveBeenCalledTimes(0)
            });

            test('Single change', async () => {
                target.name = "Changed";
                expect(target.name).toBe("Changed")
                await nextTick();
                expect(rootWatchTrigger).toHaveBeenCalledTimes(1);
            });

            test('Many changes', async () => {
                const nrChanges = 5;
                for (let i = 0; i < nrChanges; i++) {
                    target.name = `${i}`;
                    await nextTick();
                }
                expect(rootWatchTrigger).toHaveBeenCalledTimes(nrChanges);
            });
        });
    });

    describe('Computed tree', () => {

        let compTree;
        const rCount = ref(0);
        beforeEach(() => {
            const computeFn = (state, root) => {

            };
            compTree = createComputedTree(srcTree, computeFn, {count: rCount});
            watch(() => compTree.root.name, (vN, vO) => rootWatchTrigger());
        });

        test('Single change', async () => {
            compTree.root.name = "Changed";
            expect(compTree.root.name).toBe("Changed")
            await nextTick();
            expect(rootWatchTrigger).toBeCalledTimes(1);
        });

        test('Many changes', async () => {
            expect(rootWatchTrigger).toHaveBeenCalledTimes(0);
            const nrChanges = 5;
            for (let i = 0; i < nrChanges; i++) {
                compTree.root.name = `${i}`;
                await nextTick();
            }
            expect(compTree.root.name).toBe(`${nrChanges - 1}`);
            expect(rootWatchTrigger).toHaveBeenCalledTimes(nrChanges);
        });
    })
})