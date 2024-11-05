// Last element by default
// Add when there are no children
// Add when there are multiple children

import {SourceTree} from "../proxy_tree/SrcTree.js";
import {createTree} from "./TreeUtil.js";
import {CustomNode} from "../CustomNode.js";

test('No children', () => {
    const srcTree = new SourceTree().init(createTree(0));
    expect(srcTree.root.children.size).toBe(0);
    srcTree.root.children.addNode(new CustomNode("Child", []), 0);
    expect(srcTree.root.children.size).toBe(1);
    expect(srcTree.root.children[0]).toBeTruthy();
    expect(srcTree.root.children[0].parent).toBe(srcTree.root);
});

describe('Multiple children', () => {
    let srcTree, root;
    beforeEach(() => {
        srcTree = new SourceTree().init(createTree(3));
        root = srcTree.root;
        expect(root.children.size).toBe(3);
    });

    test('Add to last index', () => {
        const id = root.children.addNode(new CustomNode("Child"), -1);
        expect(root.children.size).toBe(4);
        expect(root.children[3]?.id).toBe(id);
    })
})