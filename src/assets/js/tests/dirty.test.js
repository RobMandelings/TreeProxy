import {SourceTree} from "../proxy_tree/SrcTree.js";
import {createTree} from "./TreeUtil.js";
import {OverlayTree} from "../proxy_tree/OverlayTree.js";

describe('', () => {

    let srcTree, ovTree;
    beforeEach(() => {
        srcTree = new SourceTree().init(0);
        ovTree = new OverlayTree(srcTree);
        // expect(srcTree.root.isDirty)
    })

    test('', () => {
        // srcTree.score.dirty
    });
})