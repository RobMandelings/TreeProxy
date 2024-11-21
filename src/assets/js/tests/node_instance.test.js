import {CustomNode} from "@pt/nodes/CustomNode.js";
import {createSourceTree} from "@/SimpleProxyTreeBuilders.js";

test('Check node instance', () => {
    const tree = createSourceTree({name: "Hello"});
    expect(tree.root.nodeInstanceOf(CustomNode)).toBe(true);
})