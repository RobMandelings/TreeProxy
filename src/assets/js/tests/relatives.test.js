import {SourceTree} from "../proxy_tree/SrcTree.js";
import {createTree} from "./TreeUtil.js";

test('Number of descendants', () => {

    const tree = createTree(5);
    const srcTree = new SourceTree().init(tree);
})