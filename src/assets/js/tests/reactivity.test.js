import {SourceTree} from "../proxy_tree/SrcTree.js";
import {isReactive, nextTick, ref, watch} from "vue";
import {ComputedTree} from "../proxy_tree/ComputedTree.js";

describe('Reactivity checks', () => {

    const srcTree = new SourceTree().init({name: "Root", children: [{name: "Child"}]});

    expect(isReactive(srcTree.root)).toBe(true);
    expect(isReactive(srcTree.root.children)).toBe(true);
    expect(isReactive(srcTree.root.children[0])).toBe(true);

});

function runWatchTests(description, getTarget, watchTriggers) {
    describe(description, () => {
        let target;
        beforeEach(() => {
            target = getTarget();
        });

        test('No change', async () => {
            expect(target.name).toBe(target.name);
            await nextTick();
            watchTriggers.forEach(t => expect(t).toHaveBeenCalledTimes(0));
        });

        test('Single change', async () => {
            target.name = "Changed";
            expect(target.name).toBe("Changed")
            await nextTick();
            watchTriggers.forEach(t => expect(t).toHaveBeenCalledTimes(1));
        });

        test('Many changes', async () => {
            const nrChanges = 5;
            for (let i = 0; i < nrChanges; i++) {
                target.name = `${i}`;
                await nextTick();
            }
            watchTriggers.forEach(t => expect(t).toHaveBeenCalledTimes(nrChanges));
        });
    });
}

describe("Deep watch", () => {

    let srcTree, child, initialName

    let rootWatchTrigger, childrenWatchTrigger;
    rootWatchTrigger = jest.fn();
    childrenWatchTrigger = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
        initialName = 'Child';
        srcTree = new SourceTree().init({name: 'Root', children: [{name: initialName}]});
        child = srcTree.root.children[0];
        expect(child).not.toBeFalsy();
    })

    describe('Source tree', () => {

        beforeEach(() => {
            watch(srcTree.root.children.asArray, () => childrenWatchTrigger());
            watch(srcTree.root, () => rootWatchTrigger());
        });

        runWatchTests(
            'Root level watch',
            () => srcTree.root,
            [rootWatchTrigger],
        );

        runWatchTests(
            'Nested level 1 watch',
            () => child,
            [rootWatchTrigger, childrenWatchTrigger],
        );
    });

    describe('Computed tree', () => {

        let compTree;
        const rCount = ref(0);
        beforeEach(() => {
            const computeFn = (state, root) => {

            };
            compTree = new ComputedTree(srcTree, {count: rCount}, computeFn);
            watch(compTree.root, (vN, vO) => rootWatchTrigger());
        });

        test('Single change', async () => {
            compTree.root.name = "Changed";
            expect(compTree.root.name).toBe("Changed")
            await nextTick();
            // expect(rootWatchTrigger).toBeCalledTimes(1);
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