import {createTree} from "@pt/utils/TreeUtil.js";
import {createSourceTree} from "@/SimpleProxyTreeBuilders.js";
import {CustomNode} from "@pt/nodes/CustomNode.js";
import {CoreNode} from "@pt/nodes/CoreNode.js";

describe('Relatives', () => {

    describe('Single level', () => {

        let srcTree, child, root;
        beforeEach(() => {
            srcTree = createSourceTree(createTree(5));
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
                test('Root via index', () => expect(child.ancestors[0].__proxyId__).toBe(root.__proxyId__));
                test('Root via id', () => expect(child.ancestors[root.id].__proxyId__).toBe(root.__proxyId__));
            });

            describe('Finding descendants', () => {
                test('Child from root by id', () => expect(root.descendants[child.id].__proxyId__).toBe(child.__proxyId__));
                test('Root from child by id (undefined)', () => expect(child.descendants[root.id]).toBeUndefined());
                test('Child from root via path', () => expect(root.descendants["0"].__proxyId__).toBe(child.__proxyId__));
                test('Undefined from root via path', () => expect(root.descendants["0,0"]).toBeUndefined());
            })
        });
    });

    describe('Complex tree', () => {

        let srcTree, root, childLvl1, childLvl2;
        beforeEach(() => {
            srcTree = createSourceTree(createTree([1, 2, [3, 4]]));
            root = srcTree.root;
            childLvl1 = srcTree.root.children[2];
            childLvl2 = srcTree.root.descendants["2, 0"];
            expect(childLvl2.children.size).toBe(3);
        })

        describe('Negative index to find last', () => {
            test('Root via ancestors', () => expect(childLvl2.ancestors[-1].__proxyId__).toBe(root.__proxyId__));
            test('Last child', () => expect(root.children[-1].__proxyId__).toBe(childLvl1.__proxyId__));
        })

        describe('Nr ancestors', () => {
            test('Root', () => expect(srcTree.root.ancestors.size).toBe(0));
            test('Child lvl 1', () => expect(childLvl1.ancestors.size).toBe(1));
            test('Child lvl 2', () => expect(childLvl2.ancestors.size).toBe(2));
        });

        test('Ancestor from child lvl 2', () => expect(childLvl2.ancestors.root.__proxyId__).toBe(root.__proxyId__));
        describe('Depth tests', () => {
            test('Root', () => expect(root.depth).toBe(0))
            test('Child lvl 1', () => expect(childLvl1.depth).toBe(1))
            test('Child lvl 2', () => expect(childLvl2.depth).toBe(2))
        });
        describe('Height tests', () => {
            test('Root', () => expect(root.height).toBe(3))
            test('Child lvl 1', () => expect(childLvl1.height).toBe(2))
            test('Child lvl 2', () => expect(childLvl2.height).toBe(1))
        })

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

                    expect(c1.parent.__proxyId__).toBe(root.__proxyId__);
                    expect(c1.children.size).toBe(2);
                    expect(c2?.parent?.parent.__proxyId__).toBe(root.__proxyId__);
                    expect(c2.children.size).toBe(4);
                    expect(c3?.parent?.parent?.parent?.id).toBe(root.id);
                    expect(c3.children.size).toBe(0);
                });
            });

            describe('Finding ancestors', () => {

                test('Ancestors via child 3', () => {
                    expect(c3.ancestors[root.id].__proxyId__).toBe(root.__proxyId__);
                    expect(c3.ancestors[c1.id].__proxyId__).toBe(c1.__proxyId__);
                    expect(c3.ancestors[c2.id].__proxyId__).toBe(c2.__proxyId__);
                    expect(c3.ancestors[0].__proxyId__).toBe(c2.__proxyId__);
                    expect(c3.ancestors[1].__proxyId__).toBe(c1.__proxyId__);
                    expect(c3.ancestors[2].__proxyId__).toBe(root.__proxyId__);
                });
            });
        });
    });
})

describe('Finding with custom function', () => {

    let srcTree;
    beforeEach(() => {
        srcTree = createSourceTree({
            name: "Root",
            children: [{name: "Child1", children: [{name: "ToBeFound"}]}, {name: "Child2"}]
        });
    });

    test('Find child', () => {
        expect(srcTree.root.children.find(c => c.name === "Child2")).toBeTruthy();
        expect(srcTree.root.descendants.find(c => c.name === "ToBeFound")).toBeTruthy();
    });
});

describe('Leafs', () => {

    const srcTree = createSourceTree(createTree([10, 5]));
    test('Number of leafs', () => expect(srcTree.root.leafs.size).toBe(15));
    test('Root is leaf', () => expect(srcTree.root.isLeaf).toBe(false));
    test('Child is leaf', () => expect(srcTree.root.descendants[0].isLeaf).toBe(false));
    test('Leaf is leaf', () => expect(srcTree.root.descendants["0,0"].isLeaf).toBe(true));

})

describe('Position', () => {

    let srcTree, c0, c1, c2;
    beforeEach(() => {
        srcTree = createSourceTree(createTree(3));
        c0 = srcTree.root.children[0];
        c1 = srcTree.root.children[1];
        c2 = srcTree.root.children[2];
    });

    test('Root pos', () => expect(srcTree.root.pos).toBe(0));
    test('Root max pos', () => expect(srcTree.root.maxPos).toBe(0));
    test('Child 0 pos', () => expect(c0.pos).toBe(0))
    test('Child 1 pos', () => expect(c1.pos).toBe(1))
    test('Child 2 pos', () => expect(c2.pos).toBe(2))
    test('Child max pos', () => expect(c0.maxPos).toBe(2));

    test('Move pos', () => {
        c0.movePos(2);
        expect(c0.pos).toBe(2); // Shifted all the way to the end
        expect(c2.pos).toBe(1); // Shifted one to the left
        expect(srcTree.root.children[2].id).toBe(c0.id);
    });

    test('Move pos outside range', () => {
        c0.movePos(5);
        expect(c0.pos).toBe(c0.maxPos);
    })

    test('Move pos less than 0', () => {
        c0.movePos(-5);
        expect(c0.pos).toBe(0);
    })
})

describe('Finding root', () => {
    test('From descendant', () => {
        const srcTree = createSourceTree(createTree([[[[]]]]));
        const descendant = srcTree.root.descendants["0,0,0"];
        const root = descendant.root;
        expect(root.id).toBe(srcTree.root.id);
    });

    test('From self', () => {
        const srcTree = createSourceTree(createTree(0));
        expect(srcTree.root.root.id).toBe(srcTree.root.id);
    })
})

describe('Has check based on instance', () => {
    test('CustomNode', () => {
        const srcTree = createSourceTree(createTree(3));
        expect(srcTree.root.children.has(CoreNode)).toBe(true);
    });
});

describe('Check new structure', () => {
    test('CustomNode', () => {
        const srcTree = createSourceTree(createTree(3));
        srcTree.root.name;
        // expect(srcTree.root.children.has(CoreNode)).toBe(true);
    });
});