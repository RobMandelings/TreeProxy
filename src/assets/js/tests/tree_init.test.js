import {SourceTree} from "../proxy_tree/SrcTree.js";

beforeEach(() => {
    const srcTree = new SourceTree().init({
        name: "Root",
        children: [{name: "Child1", children: [{name: "Subchild1"}]}, {name: "Child2"}]
    });
    // expect(srcTree.root.children.asArray[0].get.byPos(0).name).toBe("Child1");
    // expect(srcTree.root.children.get.byPos(1).name).toBe("Child2");
    // expect(child1.children.get.byPos(0).name).toBe("Subchild1");
})