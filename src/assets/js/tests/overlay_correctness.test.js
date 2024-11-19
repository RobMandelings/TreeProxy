import {createComputedTree, createSourceTree} from "@/SimpleProxyTreeBuilders.js";
import {createTree} from "@pt/TreeUtil.js";

describe('Removing change if same as src', () => {
    let srcTree, compTree;
    beforeEach(() => {
        srcTree = createSourceTree({name: "Root"});
        compTree = createComputedTree(srcTree, (_, __) => undefined);
    });

    test('', () => {
        compTree.root.name = "Changed";
        expect(compTree.nodeMap.elementChanges.size).toBe(1);
        compTree.root.name = "Root";
        expect(compTree.nodeMap.elementChanges.size).toBe(0);
    });
});

describe('Deep overlays', () => {

    let srcTree, compTree;
    beforeEach(() => {
        srcTree = createSourceTree({name: "Root"});
        compTree = createComputedTree(srcTree, (_, __) => undefined);
    });

    test('Deep change on GUI style', () => {
        srcTree.root.gui.style = "A";
        expect(srcTree.root.gui.style).toBe("A");
        expect(compTree.root.gui.style).toBe("A");
    })

    test('Deep change using assignment', () => {
        const gui = srcTree.root.gui;
        gui.style = "A";
        expect(srcTree.root.gui.style).toBe("A");
        expect(compTree.root.gui.style).toBe("A");
    })

    test('Deep change src gui, compWeight, compGUI', () => {

        srcTree.root.gui.style = "A";
        expect(compTree.root.gui.style).toBe("A");
        compTree.root.weight = 5;
        expect(compTree.root.weight).toBe(5);
        expect(srcTree.root.weight).toBe(0);
        expect(compTree.root.gui.style).toBe("A"); // Preserves change
        compTree.root.gui.style = "B";
        expect(compTree.root.gui.style).toBe("B");
        expect(srcTree.root.gui.style).toBe("A");

    });

    test('Test proxy', () => {
        srcTree.root.gui.style;
    })
});