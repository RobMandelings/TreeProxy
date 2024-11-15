import {createTree} from "@pt/TreeUtil.js";
import {createSourceTree} from "@/SimpleProxyTreeBuilders.js";

describe("Parent relation test", () => {

    let srcTree, child1, child2, subchild1;
    beforeEach(() => {
        srcTree = createSourceTree({
            name: "Root",
            children: [{name: "Child1", children: [{name: "Subchild1"}]}, {name: "Child2"}]
        });
        child1 = srcTree.root.children[0];
        child2 = srcTree.root.children[1];
        subchild1 = child1.children[0];
        expect(child1.name).toBe("Child1");
        expect(child2.name).toBe("Child2");
        expect(subchild1.name).toBe("Subchild1");
    })

    test('Parent relation test', () => {

        expect(child1.parent).toBe(srcTree.root);
        expect(subchild1.parent).toBe(child1);
        expect(subchild1.parent.parent).toBe(srcTree.root);

    });

    test('Parent children test', () => {
        expect(!!child1.children.size).toBe(true);
        expect(child1.children.has(subchild1.id)).toBe(true);
    });

    test('Move parent', () => {
        expect(subchild1.parent).toBe(child1);
        subchild1.setParent(child2.id);
        expect(subchild1.parent).toBe(child2);
        expect(child1.children.size).toBe(0);
        expect(child1.children[subchild1.id]).toBeUndefined();
        expect(child2.children[subchild1.id]).toBe(subchild1);
        expect(child2.children.size).toBe(1);
    });
})

test('Move parent 2', () => {

    const srcTree = createSourceTree(createTree([2, 0]));
    const child1 = srcTree.root.children[0];
    const child2 = srcTree.root.children[1];
    const subChild1 = child1.children[0];

    expect(child1.children.size).toBe(2);
    expect(child2.children.size).toBe(0);
    expect(child1.children.has(subChild1.id)).toBe(true);
    subChild1.setParent(child2.id);
    expect(child1.children.size).toBe(1);
    expect(child2.children.size).toBe(1);
    expect(child1.children.has(subChild1.id)).toBe(false);
    expect(child2.children.has(subChild1.id)).toBe(true);
});