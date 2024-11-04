import {SourceTree} from "../proxy_tree/SrcTree.js";

describe("Parent relation test", () => {

    let srcTree, child1, child2, subchild1;
    beforeEach(() => {
        srcTree = new SourceTree().init({
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
        expect(child1.children.hasAny).toBe(true);
        expect(child1.children.has(subchild1.id)).toBe(true);
    });

    // test('Move parent', () => {
    //     expect(subchild1.parent.children[0]).toBe([]);
    // expect(subchild1.parent.id).toBe(child1.id);
    // expect(child1.children.asArray).toBeNull();
    // expect(subchild1.parent.children.ids.asArray).toBeNull();
    // expect(subchild1.parent.children[subchild1.id]).toBeNull();
    // subchild1.setParent(child2.id);
    // expect(subchild1.parent.id).toBe(child2.id);
    // });
})