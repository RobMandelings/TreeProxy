// Base Node class
import {computed, reactive, ref} from "vue";

export function createReferenceProxy(nodeMap, initialId) {

    const rId = ref(initialId);
    const node = computed(() => {
        return nodeMap.getNode(rId.value);
    });

    const targetObj = reactive({node: node, id: rId});
    return new Proxy(targetObj, {
        get(t, prop, receiver) {
            if (prop === "__target__") return t;

            if (t.node && prop in t.node) return Reflect.get(t.node, prop, receiver);
            return Reflect.get(t, prop, receiver);
        },
        set(t, prop, value) {
            nodeMap.set(rId.value, prop, value);
            return true;
        }
    });
}