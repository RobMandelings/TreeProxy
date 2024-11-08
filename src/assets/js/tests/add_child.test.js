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
    // TODO test on index-out-of-range

    test('Add to last index', () => testAddChildToIndex(root, -1));
    test('Add to 2nth', () => testAddChildToIndex(root, 2));
    test('Add to first index', () => testAddChildToIndex(root, 0));
});

const testAddChildToIndex = (root, index) => {
    const prevSize = root.children.size;
    const id = root.children.addNode(new CustomNode("Child"), index);
    expect(root.children.size).toBe(prevSize + 1);
    expect(root.children[index]?.id).toBe(id);
}