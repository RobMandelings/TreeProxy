import {createSourceTree} from "@/BasicSrcTree.js";
import {CustomNode} from "@/CustomNode.js";

test('Check node instance', () => {
    const tree = createSourceTree({name: "Hello"});
    expect(tree.root.nodeInstanceOf(CustomNode)).toBe(true);
})