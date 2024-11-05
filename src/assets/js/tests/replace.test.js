import {SourceTree} from "../proxy_tree/SrcTree.js";
import {createTree} from "./TreeUtil.js";
import {CustomNode} from "../CustomNode.js";

test('Replace node', () => {

    const name = "Replaced";
    const srcTree = new SourceTree().init(createTree(3));
    const root = srcTree.root;
    const child = root.children[1];
    const oldId = child.id;
    expect(child).toBeTruthy();
    child.replace(new CustomNode(name));
    expect(root.children[1]).toBe(child);
    expect(child.id).toBe(oldId);
    expect(child.name).toBe(name);

})