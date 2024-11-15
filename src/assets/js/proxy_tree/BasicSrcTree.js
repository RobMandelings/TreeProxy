import {SourceTree} from "./SrcTree.js";
import {CustomNode} from "@pt/CustomNode.js";

export function addBasicTree(elMap, tree) {
    let childrenIds = (tree.children?.length) ? tree.children.map(c => addBasicTree(elMap, c)) : [];
    return elMap.addElement(new CustomNode(tree.name, tree.weight, childrenIds));
}

export function createSourceTree(tree) {
    const srcTree = new SourceTree();
    const rootId = addBasicTree(srcTree, tree);
    srcTree.init(rootId)
    return srcTree;
}