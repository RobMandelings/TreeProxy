// Base Node class
import {computed, reactive, ref, watch} from "vue";
import {ComputedNodeMap, SourceNodeMap} from "./NodeMap.js";


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
            if (prop === "__target__") return t;
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
    let children = computed(() =>
        nestedProxy.children.map(childProxy =>
            createParentDecoratorProxy(childProxy, proxyRef)));

    const targetObj = reactive({
        nestedProxy,
        children
    });

    const handler = {
        get(t, prop, receiver) {
            if (prop === 'parent') {
                console.warn("making parent");
                return parentProxy;
            }
            if (prop === "children") return children.value;
            if (prop in t.nestedProxy) return Reflect.get(t.nestedProxy, prop, receiver)
            return Reflect.get(t, prop, receiver);

        },
        set(t, prop, value, receiver) {
            return Reflect.set(t.nestedProxy, prop, value, receiver);
        }
    }

    proxyRef = new Proxy(targetObj, handler);
    return proxyRef;
}

// Function to create a computed tree
export function createComputedTree(srcNodeMap, rootId) {
    const computedNodeMap = reactive(new ComputedNodeMap(srcNodeMap));
    let tree = createCopyOnWriteProxy(computedNodeMap, rootId);
    tree = createParentDecoratorProxy(tree, null);
    return {tree: tree, computedNodeMap};
}

export function createSourceTree(rootNode) {
    const sourceNodeMap = reactive(new SourceNodeMap());
    const rootId = sourceNodeMap.addNode(rootNode);
    let tree = createMutableReferenceProxy(sourceNodeMap, rootId);
    tree = createParentDecoratorProxy(tree, null)
    return {srcTree: tree, sourceNodeMap};
}