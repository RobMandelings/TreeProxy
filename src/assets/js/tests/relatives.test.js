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
                test('No ancestor', () => expect(root.ancestors[0]).toBeUndefined());
                test('Root via index', () => expect(child.ancestors[0]).toBe(root));
                test('Root via id', () => expect(child.ancestors[root.id]).toBe(root));
            });

            describe('Finding descendants', () => {
                test('Child from root by id', () => expect(root.descendants[child.id]).toBe(child));
                test('Root from child by id (undefined)', () => expect(child.descendants[root.id]).toBeUndefined());
                test('Child from root via path', () => expect(root.descendants["0"]).toBe(child));
                test('Undefined from root via path', () => expect(root.descendants["0,0"]).toBeUndefined());
            })
        });
    });

    describe('Complex tree', () => {

        let srcTree, root, childLvl1, childLvl2;
        beforeEach(() => {
            srcTree = new SourceTree().init(createTree([1, 2, [3, 4]]));
            root = srcTree.root;
            childLvl1 = srcTree.root.children[2];
            childLvl2 = srcTree.root.descendants["2, 0"];
            expect(childLvl2.children.size).toBe(3);
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
        });

        describe('Finding nodes', () => {

            let c1, c2, c3, root
            beforeAll(() => {
                root = srcTree.root;
                c1 = root.descendants["2"];
                c2 = root.descendants["2, 1"];
                c3 = root.descendants["2,1,3"];
            })

            describe('Finding descendants', () => {

                test('Descendants from path correctness', () => {

                    expect(c1.parent).toBe(root);
                    expect(c1.children.size).toBe(2);
                    expect(c2?.parent?.parent).toBe(root);
                    expect(c2.children.size).toBe(4);
                    expect(c3?.parent?.parent?.parent?.id).toBe(root.id);
                    expect(c3.children.size).toBe(0);
                });
            });

            describe('Finding ancestors', () => {

                test('Ancestors via child 3', () => {
                    expect(c3.ancestors[root.id]).toBe(root);
                    expect(c3.ancestors[c1.id]).toBe(c1);
                    expect(c3.ancestors[c2.id]).toBe(c2);
                    expect(c3.ancestors[0]).toBe(c2);
                    expect(c3.ancestors[1]).toBe(c1);
                    expect(c3.ancestors[2]).toBe(root);
                });
            });
        });
    });
})