import {createComputedTree, createSourceTree} from "@/SimpleProxyTreeBuilders.js";
import {createTree} from "@pt/TreeUtil.js";
import {deepEqual} from "@pt/utils/deepObjectUtil.js";
import {CustomNode} from "@pt/CustomNode.js";

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

const getNodeChanges = (compTree) => compTree.nodeMap.elementChanges;

let copySpy = jest.spyOn(CustomNode.prototype, 'copy');
beforeEach(() => {
    jest.clearAllMocks();
})

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
        expect(copySpy).toBeCalledTimes(1);
        srcTree.root.weight = 1;
        compTree.root.weight; // Access to trigger recompute
        expect(copySpy).toBeCalledTimes(2);

    });

    test('Deep change in compTree, then undo change by setting value', () => {

        compTree.root.gui.style = "B";
        expect(compTree.root.gui.style).toBe("B")
        expect(srcTree.root.gui.style).toBe(null);
        expect(getNodeChanges(compTree).size).toBe(1);
        compTree.root.gui.style = null;
        expect(srcTree.root.gui.style).toBe(compTree.root.gui.style);
        expect(getNodeChanges(compTree).size).toBe(0);
        expect(copySpy).toBeCalledTimes(1);

    });

    test('Full object replacement', () => {

        compTree.root.gui = {style: "A", leftClick: "left"};
        expect(compTree.root.gui.style).toBe("A");
        expect(compTree.root.gui.leftClick).toBe("left");
        expect(copySpy).toBeCalledTimes(1);

        expect(srcTree.root.gui.style).toBe(null);
    });

    test('Test proxy', () => {
        srcTree.root.gui.style;
    })
});

describe('Deep mutations preserved under recomputation', () => {

    let srcTree, compTree;
    beforeEach(() => {
        srcTree = createSourceTree({name: "Root"});
        compTree = createComputedTree(srcTree, (_, root) => root.gui.style = "NewStyle");
    });

    test('Src tree adjusments', () => {
        expect(compTree.root.gui.style).toBe("NewStyle");
        expect(copySpy).toBeCalledTimes(1);
        srcTree.root.weight = 10;
        expect(compTree.root.weight).toBe(10);
        expect(compTree.root.gui.style).toBe("NewStyle");
        expect(copySpy).toBeCalledTimes(2);
    })
})