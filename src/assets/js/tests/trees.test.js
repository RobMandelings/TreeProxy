import {nextTick, watch} from "vue";
import {CustomNode} from "../CustomNode.js";
import * as Proxies from "../proxy_tree/RefProxy.js";
import {SourceTree} from "../proxy_tree/SrcTree.js";
import * as ProxyNodeErrors from "../proxy_tree/ProxyNodeErrors.js"
import * as ProxyTreeErrors from "../proxy_tree/ProxyTreeErrors.js"

test('Root not initialised', () => {
    const srcTree = new SourceTree();
    const rootId = srcTree.addTree({name: "Root"});
    expect(() => srcTree.root).toThrow(ProxyTreeErrors.RootNotSetError);
    srcTree.init(rootId)
    expect(() => srcTree.root).not.toBeNull();
})

test('Direct proxy node access', () => {
    const srcTree = new SourceTree();
    const rootId = srcTree.addTree({name: "Root", children: [{name: "Child 1"}]});
    srcTree.init(rootId);

    expect(() => srcTree.root.node).toThrow(ProxyNodeErrors.DirectNodeAccessError);
});

describe('Stale proxies', () => {

    let srcTree;
    beforeEach(() => {
        srcTree = new SourceTree();
        const rootId = srcTree.addTree({name: "Root", children: [{name: "Child 1"}]});
        srcTree.init(rootId);
        expect(srcTree.root.stale).toBe(false);
        srcTree.root.delete();
        expect(srcTree.root.stale).toBe(true);
    });

    test('Stale proxy error', () => {
        expect(() => srcTree.root.id).toThrow(ProxyNodeErrors.StaleProxyError);
    });
});

test('Hello', () => {
    const srcTree = new SourceTree();
    srcTree.addTreeAndSetRoot({name: "Root", children: [{name: "Child"}]});
    expect(srcTree.root.children.get.first()).toBe(null);
})

describe('Children', () => {

    let srcTree;
    beforeEach(() => {
        srcTree = new SourceTree();
        srcTree.addTreeAndSetRoot({name: "Root", children: [{name: "Child"}]});
    })

    test('Children as array', () => {
        expect(srcTree.root.children.asArray()).toBeInstanceOf(Array);
    });
})


xdescribe('Parent and Child relation', () => {
    const srcTree = new SourceTree();
    srcTree.addTreeAndSetRoot({name: "Root", children: [{name: "Child"}]});
    const child = srcTree.root.children.get.first;
    test('Parent relation test', () => expect(child.parent).toBe(srcTree.root));
    test('Child instance via parent equal to child instance', () => expect(child.parent.children.get.first).toBe(child));
});

xdescribe("Deep watch on source tree", () => {

    let srcTree, child, mockCallback, initialChildName;

    beforeEach(() => {
        initialChildName = 'Child';
        srcTree = new SourceTree().addTreeAndSetRoot({name: 'Root', children: [{name: initialChildName}]});
        child = srcTree.root.children[0];
        mockCallback = jest.fn();
        watch(srcTree.root, () => mockCallback());
    })

    test('Test initial child name change', async () => {
        child.name = "Changed";
        await nextTick();
        expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('Assign with no change', async () => {
        child.name = initialChildName;
        await nextTick();
        expect(mockCallback).toHaveBeenCalledTimes(0);
    })

    test('Many changes', async () => {
        let count = 0;
        const nrChanges = 5;
        for (let i = 0; i < nrChanges; i++) {
            child.name = `${count++}`;
            await nextTick();
        }
        expect(mockCallback).toHaveBeenCalledTimes(nrChanges);
    })
})