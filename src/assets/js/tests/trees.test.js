import {reactive, watch} from "vue";
import {SourceNodeMap} from "../NodeMap.js";
import {CustomNode} from "../CustomNode.js";
import * as Proxies from "../Proxies.js";

describe('Parent and Child relation', () => {
    const sourceNodeMap = reactive(new SourceNodeMap());
    const childId = sourceNodeMap.addNode(new CustomNode('Child 2'));
    const rootId = sourceNodeMap.addNode(new CustomNode('Root', [childId]));

    const root = Proxies.createSourceTree(sourceNodeMap, rootId);
    const child = root.children[0];

    test('Child id test', () => expect(child.id).toBe(childId));
    test('Root id test', () => expect(root.id).toBe(rootId));
    test('Parent relation test', () => expect(child.parent).toBe(root));
    // test('Child instance via parent equal to child instance', () => expect(child.parent.children[0]).toBe(child));
})

describe("Deep watch on source tree", () => {

    const sourceNodeMap = reactive(new SourceNodeMap());
    const childId = sourceNodeMap.addNode(new CustomNode('Child 2'));
    const rootId = sourceNodeMap.addNode(new CustomNode('Root', [childId]));
    const root = Proxies.createSourceTree(sourceNodeMap, rootId);
    const child = root.children[0];

    const mockCallback = jest.fn();
    watch(() => root.children.name, () => mockCallback());

    test('Test initial child name change', () => {
        child.name = "Changed";
        expect(mockCallback).toHaveBeenCalledTimes(1)
    });

})