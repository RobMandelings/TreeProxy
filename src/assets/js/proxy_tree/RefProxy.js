// Base Node class
import {computed, reactive, ref} from "vue";
import {ComputedNodeMap, SourceNodeMap} from "../NodeMap.js";


// Tree class to manage nodes

function createReferenceProxy(nodeMap, initialId, setHandler) {

    const id = ref(initialId);
    const node = computed(() => {
        return nodeMap.getNode(id.value);
    });

    const targetObj = reactive({node: node, id: id});
    return new Proxy(targetObj, {
        get(t, prop, receiver) {
            if (prop === "__target__") return t;
            
            if (t.node && prop in t.node) return Reflect.get(t.node, prop, receiver);
            return Reflect.get(t, prop, receiver);
        },
        set: setHandler
    });
}

// Proxy layer 1: Map IDs to references
export function createMutableReferenceProxy(nodeMap, initialId) {

    const setHandler = (t, prop, value) => {
        t.node[prop] = value;
        return true;
    }
    return createReferenceProxy(nodeMap, initialId, setHandler);
}

// Proxy layer 2: Copy-on-write
export function createCopyOnWriteProxy(computedNodeMap, initialId) {

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