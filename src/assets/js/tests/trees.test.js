import {isReactive, isRef, nextTick, watch} from "vue";
import {SourceTree} from "../proxy_tree/SrcTree.js";
import * as ProxyNodeErrors from "../proxy_tree/ProxyNodeErrors.js"
import * as ProxyTreeErrors from "../proxy_tree/ProxyTreeErrors.js"
import {PosOutOfRangeError} from "../proxy_tree/ProxyNodeErrors.js";

test('Root not initialised', () => {
    const srcTree = new SourceTree();
    expect(() => srcTree.root).toThrow(ProxyTreeErrors.RootNotSetError);
    srcTree.init({name: "Root"})
    expect(() => srcTree.root).not.toBeNull();
})

test('Direct proxy node access', () => {
    const srcTree = new SourceTree();
    const rootId = srcTree.init({name: "Root", children: [{name: "Child 1"}]});

    expect(() => srcTree.root.node).toThrow(ProxyNodeErrors.DirectNodeAccessError);
});

describe('Stale proxies', () => {

    let srcTree;
    beforeEach(() => {
        srcTree = new SourceTree().init({name: "Root", children: [{name: "Child 1"}]});
        expect(srcTree.root.stale).toBe(false);
        srcTree.root.delete();
        expect(srcTree.root.stale).toBe(true);
    });

    test('Stale proxy error', () => {
        expect(() => srcTree.root.id).toThrow(ProxyNodeErrors.StaleProxyError);
    });
});
describe('Children', () => {

    let srcTree = new SourceTree();
    describe('Single child', () => {
        beforeAll(() => srcTree.init({name: "Root", children: [{name: "Child"}]}));
        test('Size', () => expect(srcTree.root.children.size).toBe(1));
        test('Array', () => expect(srcTree.root.children.asArray).toBeInstanceOf(Array));
        test('Set', () => expect(srcTree.root.children.asSet).toBeInstanceOf(Set));
        test('First', () => expect(srcTree.root.children.get.first).not.toBeNull());
    });

    describe('No child', () => {
        beforeAll(() => srcTree.init({name: "Root"}));
        test('Size', () => expect(srcTree.root.children.size).toBe(0))
        test('Array', () => expect(srcTree.root.children.asArray).toBeInstanceOf(Array));
        test('Set', () => expect(srcTree.root.children.asSet).toBeInstanceOf(Set));
        // test('byPos out of range', () => expect(srcTree.root.children.get.byPos(0)).toThrow(ProxyNodeErrors.PosOutOfRangeError));
        test('First', () => expect(srcTree.root.children.get.first).toBeNull())
    });

    test('Children as array', () => {
        expect(srcTree.root.children.asArray).toBeInstanceOf(Array);
    });

    describe('Proxy reuse on multiple access', () => {
        test('Single child', () => {
            const srcTree = new SourceTree().init({name: "Root", children: [{name: "Child"}]});
            expect(srcTree.root.children.asArray).toBe(srcTree.root.children.asArray);
            expect(srcTree.root.children.get.first).toBe(srcTree.root.children.get.first);

        })
    })
});


describe('Parent and Child relation', () => {
    const srcTree = new SourceTree();
    srcTree.init({name: "Root", children: [{name: "Child"}]});
    const child = srcTree.root.children.get.first;
    test('Parent relation test', () => expect(child.parent).toBe(srcTree.root));
    test('Child instance via parent equal to child instance', () => expect(child.parent.children.get.first).toBe(child));
});