import {SourceTree} from "../proxy_tree/SrcTree.js";
import {isReactive, nextTick, watch} from "vue";

describe('Reactivity checks', () => {

    const srcTree = new SourceTree().init({name: "Root", children: [{name: "Child"}]});

    expect(isReactive(srcTree.root)).toBe(true);
    expect(isReactive(srcTree.root.children)).toBe(true);
    expect(isReactive(srcTree.root.children.get.byPos(0))).toBe(true);

});

function runWatchTests(description, getTarget, getWatchTriggers, initialValue) {
    describe(description, () => {
        let target, watchTriggers;

        beforeEach(() => {
            target = getTarget();
            watchTriggers = getWatchTriggers();
        });

        test('No change', async () => {
            target.name = initialValue;
            await nextTick();
            Object.values(watchTriggers).forEach(trigger =>
                expect(trigger).toHaveBeenCalledTimes(0)
            );
        });

        test('Single change', async () => {
            target.name = "Changed";
            await nextTick();
            Object.values(watchTriggers).forEach(trigger =>
                expect(trigger).toHaveBeenCalledTimes(1)
            );
        });

        test('Many changes', async () => {
            const nrChanges = 5;
            for (let i = 0; i < nrChanges; i++) {
                target.name = `${i}`;
                await nextTick();
            }
            Object.values(watchTriggers).forEach(trigger =>
                expect(trigger).toHaveBeenCalledTimes(nrChanges)
            );
        });
    });
}

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

    runWatchTests(
        'Root level watch',
        () => srcTree.root,
        () => ({rootWatchTrigger}),
        'Root'
    );

    runWatchTests(
        'Nested level 1 watch',
        () => child,
        () => ({rootWatchTrigger, childrenWatchTrigger}),
        'Child'
    );
})