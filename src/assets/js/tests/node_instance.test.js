import {createSourceTree} from "@pt/BasicSrcTree.js";
import {CustomNode} from "@pt/CustomNode.js";

test('Check node instance', () => {
    const tree = createSourceTree({name: "Hello"});
    expect(tree.root.nodeInstanceOf(CustomNode)).toBe(true);
})