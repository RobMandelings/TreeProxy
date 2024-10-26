// Base Node class
export class Node {
    constructor(id, name, childrenIds) {
        this.id = id;
        this.name = name;
        this.childrenIds = childrenIds;
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

// Proxy layer 1: Map IDs to references
function createReferenceProxy(tree, nodeId) {
    return new Proxy({}, {
        get(_, prop) {
            const node = tree.getNode(nodeId);
            if (prop === 'children') {
                return node.childrenIds.map(id => createReferenceProxy(tree, id));
            }
            return node[prop];
        },
        set(_, prop, value) {
            const node = tree.getNode(nodeId);
            node[prop] = value;
            return true;
        }
    });
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

// Proxy layer 2: Copy-on-write
// function createCopyOnWriteProxy(sourceNodeMap, computedNodeMap, nodeId) {
//     return new Proxy({}, {
//         get(_, prop) {
//             let refProxy;
//             if (computedNodeMap.getNode(nodeId)) {
//                 refProxy = createReferenceProxy(computedNodeMap, nodeId);
//             }
//             refProxy = createReferenceProxy(sourceNodeMap, nodeId);
//             refProxy = createParentDecoratorProxy(refProxy, null);
//             return refProxy[prop];
//         },
//         set(_, prop, value) {
//             if (!computedNodeMap.getNode(nodeId)) {
//                 const sourceNode = sourceNodeMap.getNode(nodeId);
//                 const newNode = new Node(nodeId, {...sourceNode.properties});
//                 newNode.childrenIds = [...sourceNode.childrenIds];
//                 computedNodeMap.addNode(newNode);
//             }
//             createReferenceProxy(computedNodeMap, nodeId)[prop] = value;
//             return true;
//         }
//     });
// }

// Function to create a computed tree
export function createComputedTree(sourceNodeMap, rootId) {
    const computedNodeMap = new NodeMap();
    const refProxy = createReferenceProxy(sourceNodeMap, rootId);
    const parentProxy = createParentDecoratorProxy(refProxy, "Chicago");
    return parentProxy;
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
