import {SourceTree} from "../proxy_tree/SrcTree.js";
import {createTree} from "./TreeUtil.js";

describe('Relatives', () => {

    describe('Single level', () => {

        let srcTree = new SourceTree();
        beforeEach(() => {
            srcTree.init(createTree(5));
        });

        describe('Nr descendants', () => {
            test('Root', () => {
                expect(srcTree.root.selfAndDescendants.size).toBe(6); // Root + 5
            })

            test('Child', () => {
                expect(srcTree.root.children.get.first.selfAndDescendants.size).toBe(1); // Root + 5
            })
        });
    });

    describe('Complex tree', () => {

        let srcTree = new SourceTree();
        beforeEach(() => {
            srcTree.init(createTree([1, 2, [3, 4]]));
        })

        describe('Nr descendants', () => {
            test('Root', () => {
                expect(srcTree.root.selfAndDescendants.size).toBe(16);
            })

            test('Child lvl 1', () => {
                expect(srcTree.root.children.get.byPos(2).selfAndDescendants.size).toBe(10);
            })

            test('Child lvl 2', () => {
                expect(srcTree.root.children.get.byPos(2).children.get.byPos(0).selfAndDescendants.size).toBe(4);
            });
        });
    });
})