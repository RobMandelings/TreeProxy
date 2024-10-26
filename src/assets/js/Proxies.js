// Base Node class
import {computed, reactive, watch} from "vue";

export class Node {
    constructor(id, name, childrenIds) {
        this.id = id;
        this.name = name;
        this.childrenIds = childrenIds;
    }

    copy() {
        console.log(`Made copy of node with id ${this.id}`);
        return new Node(this.id, this.name, this.childrenIds);
    }
}

// Tree class to manage nodes
export class NodeMap {
    constructor() {
        this.nodes = new Map();
    }

    addNode(node) {
        this.nodes.set(node.id, node);
    }

    getNode(id) {
        return this.nodes.get(id);
    }
}

export class ComputedNodeMap extends NodeMap {

    constructor(srcNodeMap) {
        super();
        this.srcNodeMap = srcNodeMap;
    }

    getNode(id) {
        const node = this.getComputedNode(id);
        if (!node) return this.srcNodeMap.getNode(id);
        return node;
    }

    getComputedNode(id) {
        return super.getNode(id);
    }
}

function createReferenceProxy(nodeMap, nodeId, setHandler) {
    const node = computed(() => {
        // console.log(`Recomputing node ${nodeId}`);
        return nodeMap.getNode(nodeId);
    });
    const children = computed(() => {
        // console.log("Recomputing children");
        return node.value.childrenIds.map(id => createReferenceProxy(nodeMap, id, setHandler))
    });
    const targetObj = reactive({node: node, children: children});
    return new Proxy(targetObj, {
        get(t, prop, receiver) {
            if (prop in t.node) return Reflect.get(t.node, prop, receiver);

            return Reflect.get(t, prop, receiver);
        },
        set: setHandler
    });
}

// Proxy layer 1: Map IDs to references
function createMutableReferenceProxy(nodeMap, nodeId) {

    const setHandler = (t, prop, value) => {
        t.node[prop] = value;
        return true;
    }
    return createReferenceProxy(nodeMap, nodeId, setHandler);
}

// Proxy layer 2: Copy-on-write
function createCopyOnWriteProxy(computedNodeMap, nodeId) {

    const setHandler = (t, prop, value) => {
        if (!computedNodeMap.getComputedNode(t.node.id)) {
            const srcNode = computedNodeMap.srcNodeMap.getNode(t.node.id);
            const newNode = srcNode.copy();
            computedNodeMap.addNode(newNode);
        }
        t.node[prop] = value;
        return true;
    }
    return createReferenceProxy(computedNodeMap, nodeId, setHandler);
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
