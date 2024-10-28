import {nextTick, reactive, watch} from "vue";
import {SourceNodeMap} from "../NodeMap.js";
import {CustomNode} from "../CustomNode.js";
import * as Proxies from "../Proxies.js";

describe('Parent and Child relation', () => {
    const {srcTree, sourceNodeMap} = Proxies.createSourceTree(new CustomNode('Root'));
    const childId = sourceNodeMap.addNode(new CustomNode('Child 2'));
    srcTree.childrenIds = [childId];
    const child = srcTree.children[0];

    test('Child id test', () => expect(child.id).toBe(childId));
    test('Parent relation test', () => expect(child.parent).toBe(srcTree));
    // test('Child instance via parent equal to child instance', () => expect(child.parent.children[0]).toBe(child));
})

describe("Deep watch on source tree", () => {

    test('Test initial child name change', async () => {
        const initialChildName = 'Child';
        const {srcTree, sourceNodeMap} = Proxies.createSourceTree(new CustomNode('Root'));
        const childId = sourceNodeMap.addNode(new CustomNode(initialChildName));
        srcTree.childrenIds = [childId];
        const child = srcTree.children[0];

        const mockCallback = jest.fn();
        watch(srcTree, () => mockCallback());

        child.name = "Changed";
        await nextTick();
        expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('Assign with no change', async () => {
        const initialChildName = 'Child';
        const {srcTree, sourceNodeMap} = Proxies.createSourceTree(new CustomNode('Root'));
        const childId = sourceNodeMap.addNode(new CustomNode(initialChildName));
        srcTree.childrenIds = [childId];
        const child = srcTree.children[0];

        const mockCallback = jest.fn();
        watch(srcTree, () => mockCallback());

        expect(child.name).toBe(initialChildName);
        child.name = initialChildName;
        await nextTick();
        expect(mockCallback).toHaveBeenCalledTimes(0);
    })
})