import {SourceTree} from "../proxy_tree/SrcTree.js";
import {createTree} from "./TreeUtil.js";

describe('Relatives', () => {

    describe('Single level', () => {

        let srcTree, child, root;
        beforeEach(() => {
            srcTree = new SourceTree().init(createTree(5));
            root = srcTree.root;
            child = srcTree.root.children[0];
        });

        describe('Nr ancestors', () => {
            test('Root', () => expect(root.ancestors.size).toBe(0));
            test('Child', () => expect(root.children[0].ancestors.size).toBe(1));
        })

        describe('Nr descendants', () => {
            test('Root', () => {
                expect(root.descendants.size).toBe(5); // Root + 5
            })

            test('Child', () => {
                expect(child.descendants.size).toBe(0); // Root + 5
            })
        });

        describe('Boolean relative checks', () => {

            test('Ancestor of', () => {
                expect(root.isAncestorOf(root.id)).toBe(false);
                expect(root.isAncestorOf(child.id)).toBe(true);
                expect(child.isAncestorOf(root.id)).toBe(false);
            });

            test('Descendant of', () => {
                expect(root.isDescendantOf(root.id)).toBe(false);
                expect(child.isDescendantOf(root.id)).toBe(true);
                expect(root.isDescendantOf(child.id)).toBe(false);
            });
        });

        describe('Finding nodes', () => {
            describe('Finding ancestors', () => {
                // test('Hallo', () => {
                //     const anc = root.ancestors;
                //     console.log(anc.toString());
                //     expect(true).toBe(true);
                // })
                test('Root via index', () => expect(root.ancestors).toBe(root));
            });
        });
    });

    describe('Complex tree', () => {

        let srcTree, root, childLvl1, childLvl2;
        beforeEach(() => {
            srcTree = new SourceTree().init(createTree([1, 2, [3, 4]]));
            root = srcTree.root;
            childLvl1 = srcTree.root.children[2];
            childLvl2 = srcTree.root.descendants["2, 0, 0"];
        })

        describe('Nr ancestors', () => {
            test('Root', () => expect(srcTree.root.ancestors.size).toBe(0));
            test('Child lvl 1', () => expect(childLvl1.ancestors.size).toBe(1));
            test('Child lvl 2', () => expect(childLvl2.ancestors.size).toBe(2));
        });

        describe('Nr descendants', () => {
            test('Root', () => expect(srcTree.root.descendants.size).toBe(15));
            test('Child lvl 1', () => expect(childLvl1.descendants.size).toBe(9));
            test('Child lvl 2', () => expect(childLvl2.descendants.size).toBe(3));
        });

        describe('Boolean relative checks', () => {

            test('Ancestor of', () => {
                expect(root.isAncestorOf(childLvl1.id)).toBe(true);
                expect(root.isAncestorOf(childLvl2.id)).toBe(true);
                expect(childLvl2.isAncestorOf(root.id)).toBe(false);
            });

            test('Descendant of', () => {
                expect(childLvl1.isDescendantOf(root.id)).toBe(true);
                expect(childLvl2.isDescendantOf(root.id)).toBe(true);
                expect(root.isDescendantOf(childLvl2.id)).toBe(false);
            });
        })
    });
})