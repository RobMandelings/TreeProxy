import {SourceTree} from "../proxy_tree/SrcTree.js";
import {createTree} from "./TreeUtil.js";

describe('Relatives', () => {

    describe('Single level', () => {

        let srcTree = new SourceTree();
        beforeEach(() => {
            srcTree.init(createTree(5));
        });

        describe('Nr ancestors', () => {
            test('Root', () => expect(srcTree.root.selfAndAncestors.size).toBe(1));
            test('Child', () => expect(srcTree.root.children[0].selfAndAncestors.size).toBe(2));
        })

        describe('Nr descendants', () => {
            test('Root', () => {
                expect(srcTree.root.selfAndDescendants.size).toBe(6); // Root + 5
            })

            test('Child', () => {
                expect(srcTree.root.children[0].selfAndDescendants.size).toBe(1); // Root + 5
            })
        });
    });

    describe('Complex tree', () => {

        let srcTree = new SourceTree();
        let childLvl1, childLvl2;
        beforeEach(() => {
            srcTree.init(createTree([1, 2, [3, 4]]));
            childLvl1 = srcTree.root.children[2];
            childLvl2 = srcTree.root.selfAndDescendants.get.fromPath([2, 0, 0]);
        })

        describe('Nr ancestors', () => {
            test('Root', () => expect(srcTree.root.selfAndAncestors.size).toBe(1));
            test('Child lvl 1', () => expect(childLvl1.selfAndAncestors.size).toBe(2));
            test('Child lvl 2', () => expect(childLvl2.selfAndAncestors.size).toBe(3));
        });

        describe('Nr descendants', () => {
            test('Root', () => expect(srcTree.root.selfAndDescendants.size).toBe(16));
            test('Child lvl 1', () => expect(childLvl1.selfAndDescendants.size).toBe(10));
            test('Child lvl 2', () => expect(childLvl2.selfAndDescendants.size).toBe(4));
        });
    });
})