import {SourceTree} from "@pt/tree/SrcTree.js";
import * as ProxyNodeErrors from "@pt/tree_node/ProxyNodeErrors.js"
import * as ProxyTreeErrors from "@pt/tree/TreeErrors.js"
import {nextTick, watch} from "vue";
import {createSourceTree} from "@/SimpleProxyTreeBuilders.js";

test('Direct proxy node access', () => {
    const srcTree = createSourceTree({name: "Root", children: [{name: "Child 1"}]});
    expect(() => srcTree.root.node).toThrow(ProxyNodeErrors.DirectNodeAccessError);
});

describe('Children', () => {

    let srcTree = new SourceTree();
    let first;
    describe('Single child', () => {
        beforeAll(() => {
            srcTree = createSourceTree({name: "Root", children: [{name: "Child"}]})
            first = srcTree.root.children[0];
        });
        test('First', () => expect(first).not.toBeUndefined());
        test('Size', () => expect(srcTree.root.children.size).toBe(1));
        test('Array', () => expect(srcTree.root.children.asArray).toBeInstanceOf(Array));
        test('Set', () => expect(srcTree.root.children.asSet).toBeInstanceOf(Set));

        test('HasChildren', () => expect(!!srcTree.root.children.size).toBe(true));
        test('Has', () => expect(srcTree.root.children.has(first.id)).toBe(true));
    });

    describe('No child', () => {
        beforeAll(() => srcTree = createSourceTree({name: "Root"}));
        test('Size', () => expect(srcTree.root.children.size).toBe(0))
        test('Array', () => expect(srcTree.root.children.asArray).toBeInstanceOf(Array));
        test('Set', () => expect(srcTree.root.children.asSet).toBeInstanceOf(Set));
        // test('byPos out of range', () => expect(srcTree.root.children.get.byPos(0)).toThrow(ProxyNodeErrors.PosOutOfRangeError));
        test('First', () => expect(srcTree.root.children[0]).toBeUndefined());

        test('HasChildren', () => expect(!!srcTree.root.children.size).toBe(false));
    });

    describe('Proxy reuse on multiple access', () => {
        test('Single child', () => {
            const srcTree = createSourceTree({name: "Root", children: [{name: "Child"}]});
            expect(srcTree.root.children.asArray).toBe(srcTree.root.children.asArray);
            expect(srcTree.root.children[0]).toBe(srcTree.root.children[0]);

        })
    })
});


describe('Parent and Child relation', () => {
    const srcTree = createSourceTree({name: "Root", children: [{name: "Child"}]});
    const child = srcTree.root.children[0];
    test('Parent relation test', () => expect(child.parent.__proxyId__).toBe(srcTree.root.__proxyId__));
    test('Child instance via parent equal to child instance', () => expect(child.parent.children[0]).toBe(child));
});