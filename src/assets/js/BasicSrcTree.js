import {CustomNode} from "./CustomNode.js";
import {SourceTree} from "./proxy_tree/SrcTree.js";

export function addBasicTree(nodeMap, tree) {
    let childrenIds = (tree.children?.length) ? tree.children.map(c => addBasicTree(nodeMap, c)) : [];
    return nodeMap.addNode(new CustomNode(tree.name, tree.weight, childrenIds));
}

export function createSourceTree(tree) {
    const srcTree = new SourceTree();
    const rootId = addBasicTree(srcTree, tree);
    srcTree.init(rootId)
    return srcTree;
}