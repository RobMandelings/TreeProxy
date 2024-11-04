import {SourceTree} from "../proxy_tree/SrcTree.js";
import {isReactive, nextTick, watch} from "vue";

describe('Reactivity checks', () => {

    const srcTree = new SourceTree().init({name: "Root", children: [{name: "Child"}]});

    expect(isReactive(srcTree.root)).toBe(true);
    expect(isReactive(srcTree.root.children)).toBe(true);
    expect(isReactive(srcTree.root.children.get.byPos(0))).toBe(true);

});

describe("Watch on source tree", () => {

    let srcTree, child, initialChildName;
    let rootWatchTrigger, childrenWatchTrigger;

    beforeEach(() => {
        initialChildName = 'Child';
        srcTree = new SourceTree().init({name: 'Root', children: [{name: initialChildName}]});
        child = srcTree.root.children.get.byPos(0);
        rootWatchTrigger = jest.fn();
        childrenWatchTrigger = jest.fn();
        expect(child).not.toBeFalsy();
        watch(srcTree.root.children.asArray, () => childrenWatchTrigger());
        watch(srcTree.root, () => rootWatchTrigger());
    })

    describe('Root level watch', () => {

        test('No change', async () => {
            srcTree.root.name = 'Root';
            await nextTick();
            expect(rootWatchTrigger).toHaveBeenCalledTimes(0);
        })

        test('Single change', async () => {
            srcTree.root.name = "Changed";
            await nextTick();
            expect(rootWatchTrigger).toHaveBeenCalledTimes(1);
        });

        test('Many changes', async () => {
            let count = 0;
            const nrChanges = 5;
            for (let i = 0; i < nrChanges; i++) {
                srcTree.root.name = `${count++}`;
                await nextTick();
            }
            expect(rootWatchTrigger).toHaveBeenCalledTimes(nrChanges);
        })
    });

    describe('Nested level 1 watch', () => {

        test('Assign with no change', async () => {
            child.name = initialChildName;
            await nextTick();
            expect(rootWatchTrigger).toHaveBeenCalledTimes(0);
            expect(childrenWatchTrigger).toHaveBeenCalledTimes(0);
        })

        test('Test initial child name change', async () => {
            child.name = "Changed";
            await nextTick();

            expect(rootWatchTrigger).toHaveBeenCalledTimes(1);
            expect(childrenWatchTrigger).toHaveBeenCalledTimes(1);
        });

        test('Many changes', async () => {
            let count = 0;
            const nrChanges = 5;
            for (let i = 0; i < nrChanges; i++) {
                child.name = `${count++}`;
                await nextTick();
            }
            expect(rootWatchTrigger).toHaveBeenCalledTimes(nrChanges);
            expect(childrenWatchTrigger).toHaveBeenCalledTimes(nrChanges);
        })
    })
})