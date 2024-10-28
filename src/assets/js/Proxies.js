// Base Node class
import {computed, reactive, ref, watch} from "vue";
import {ComputedNodeMap} from "./NodeMap.js";



// Tree class to manage nodes

function createReferenceProxy(nodeMap, initialId, setHandler) {

    const id = ref(initialId);
    const node = computed(() => {
        // console.log(`Recomputing node ${nodeId}`);
        return nodeMap.getNode(id.value);
    });
    const children = computed(() => {
        // console.log("Recomputing children");
        return node.value.childrenIds.map(id => createReferenceProxy(nodeMap, id, setHandler))
    });
    const targetObj = reactive({node: node, children: children, id: id});
    return new Proxy(targetObj, {
        get(t, prop, receiver) {
            if (prop in t.node) return Reflect.get(t.node, prop, receiver);

            return Reflect.get(t, prop, receiver);
        },
        set: setHandler
    });
}

// Proxy layer 1: Map IDs to references
function createMutableReferenceProxy(nodeMap, initialId) {

    const setHandler = (t, prop, value) => {
        t.node[prop] = value;
        return true;
    }
    return createReferenceProxy(nodeMap, initialId, setHandler);
}

// Proxy layer 2: Copy-on-write
function createCopyOnWriteProxy(computedNodeMap, initialId) {

    const setHandler = (t, prop, value) => {
        if (!computedNodeMap.getOverwrittenNode(t.id)) {
            const srcNode = computedNodeMap.srcNodeMap.getNode(t.id);
            const newNode = srcNode.copy();
            computedNodeMap.overwriteNode(t.id, newNode);
        }
        t.node[prop] = value;
        return true;
    }
    return createReferenceProxy(computedNodeMap, initialId, setHandler);
}

function createParentDecoratorProxy(nestedProxy, parentProxy) {

    let proxyRef;

    const handler = {
        get(t, prop, receiver) {
            if (prop === 'parent') {
                console.warn("making parent");
                return parentProxy;
            }
            if (prop === 'children') return t.children.map(childProxy => createParentDecoratorProxy(childProxy, proxyRef));
            return Reflect.get(t, prop, receiver);
        }
    }

    proxyRef = new Proxy(nestedProxy, handler);
    return proxyRef;
}

// Function to create a computed tree
export function createComputedTree(srcNodeMap, rootId) {
    const computedNodeMap = reactive(new ComputedNodeMap(srcNodeMap));
    let tree = createCopyOnWriteProxy(computedNodeMap, rootId);
    tree = createParentDecoratorProxy(tree, null);
    return {tree: tree, computedNodeMap};
}

export function createSourceTree(sourceNodeMap, rootId) {
    let tree = createMutableReferenceProxy(sourceNodeMap, rootId);
    tree = createParentDecoratorProxy(tree, null)
    return tree;
}

// Create a computed tree
// const computedTree = createComputedTree(sourceTree);

// Access and modify nodes
// console.log(computedTree.getNode(1).name); // Output: Root
// console.log(computedTree.getNode(1).children[0].name); // Output: Child 1

// Modify a node in the computed tree
// computedTree.applyChanges([
//     {nodeId: 2, prop: 'name', value: 'Modified Child 1'}
// ]);

// console.log(sourceTree.getNode(2).properties.name); // Output: Child 1
// console.log(computedTree.getNode(2).name); // Output: Modified Child 1

// Access parent
// console.log(computedTree.getNode(2).parent.name); // Output: Root
