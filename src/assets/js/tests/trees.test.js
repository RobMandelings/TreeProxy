import {SourceTree} from "@pt/SrcTree.js";
import * as ProxyNodeErrors from "@pt/ProxyNodeErrors.js"
import * as ProxyTreeErrors from "@pt/ProxyTreeErrors.js"
import {watch} from "vue";
import {addBasicTree, createSourceTree} from "@pt/BasicSrcTree.js";

test('Root not initialised', () => {
    const srcTree = new SourceTree();
    const rootId = addBasicTree(srcTree, {name: "Root"});
    expect(() => srcTree.root).toThrow(ProxyTreeErrors.RootNotSetError);
    srcTree.init(rootId);
    expect(() => srcTree.root).not.toBeNull();
})

test('Direct proxy node access', () => {
    const srcTree = createSourceTree({name: "Root", children: [{name: "Child 1"}]});
    expect(() => srcTree.root.node).toThrow(ProxyNodeErrors.DirectNodeAccessError);
});

describe('Delayed child computation', () => {

    let srcTree, spy;
    beforeEach(() => {
        const originalMethod = SourceTree.prototype.getChildren;
        // spy = jest.spyOn(SourceTree.prototype, 'getChildren');
        spy = jest.spyOn(SourceTree.prototype, 'getChildren').mockImplementation(function (id) {
            // Log the method call
            // console.log('Method called with args:', args);

            // console.log(`Method called with id: ${id} and name ${this.getElement(id).name}`)
            // Call the original implementation and store the result
            const result = originalMethod.apply(this, [id]);

            // Log the result
            // console.log('Method returned:', result);

            // Return the original result
            return result;
        });
        srcTree = createSourceTree({
            name: "Root",
            children: [{name: "Child1"}, {name: "Child2", children: [{name: "Subchild1"}]}, {name: "Child3"}]
        });
        spy.mockClear();
    });

    afterEach(() => {
        spy.mockRestore();
    });

    test('Watch install', () => {
        // Deep watching triggers nested properties to be tracked as well. This triggers therefore .children (getChildren) on each node.
        watch(srcTree.root, () => undefined);
        const callCount = spy.mock.calls.length;
        spy.mockRestore();
    });
})

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
    test('Parent relation test', () => expect(child.parent).toBe(srcTree.root));
    test('Child instance via parent equal to child instance', () => expect(child.parent.children[0]).toBe(child));
});