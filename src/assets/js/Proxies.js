// Base Node class
import {computed, reactive} from "vue";

export class Node {
    constructor(id, name, childrenIds) {
        this.id = id;
        this.name = name;
        this.childrenIds = childrenIds ?? [];
    }

    copy() {
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
    const node = computed(() => nodeMap.getNode(nodeId));
    const children = computed(() => {
        return node.value.childrenIds.map(id => createReferenceProxy(nodeMap, id, setHandler))
    });
    return new Proxy({node: node, children: children}, {
        get(t, prop) {
            if (prop === 'children') return t.children.value;
            return t.node.value[prop];
        },
        set: setHandler
    });
}

// Proxy layer 1: Map IDs to references
function createMutableReferenceProxy(nodeMap, nodeId) {

    const setHandler = (_, prop, value) => {
        const node = nodeMap.getNode(nodeId);
        node[prop] = value;
        return true;
    }
    return createReferenceProxy(nodeMap, nodeId, setHandler);
}

// Proxy layer 2: Copy-on-write
function createCopyOnWriteProxy(computedNodeMap, nodeId) {

    const setHandler = (t, prop, value) => {
        if (!computedNodeMap.getComputedNode(nodeId)) {
            const srcNode = computedNodeMap.srcNodeMap.getNode(nodeId);
            const newNode = srcNode.copy();
            computedNodeMap.addNode(newNode);
        }
        t.node.value[prop] = value;
        return true;
    }
    return createReferenceProxy(computedNodeMap, nodeId, setHandler);
}

function createParentDecoratorProxy(nodeProxy, parentProxy) {

    let proxyRef;
    const handler = {
        get(_, prop) {
            if (prop === 'parent') return parentProxy;
            if (prop === 'children') {
                return nodeProxy.children.map(childProxy => createParentDecoratorProxy(childProxy, proxyRef));
            }
            return nodeProxy[prop];
        }
    }

    proxyRef = new Proxy(nodeProxy, handler);
    return proxyRef;
}

// Function to create a computed tree
export function createComputedTree(srcNodeMap, rootId) {
    const computedNodeMap = reactive(new ComputedNodeMap(srcNodeMap));
    const refProxy = createCopyOnWriteProxy(computedNodeMap, rootId);
    const parentProxy = createParentDecoratorProxy(refProxy, null);
    return {compTree: reactive(parentProxy), computedNodeMap};
}

export function createSourceTree(sourceNodeMap, rootId) {
    const refProxy = createMutableReferenceProxy(sourceNodeMap, rootId);
    const parentProxy = createParentDecoratorProxy(refProxy, null)
    return reactive(parentProxy);
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
