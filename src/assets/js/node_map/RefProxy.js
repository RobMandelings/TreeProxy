import {computed, reactive, ref} from "vue";
import {getExcludeProperties} from "../Utils.js";

function useDirty(rId, nodeMap) {
    const rDirty = computed(() => nodeMap.isDirty(rId.value));
    const isDirtyProp = (prop) => nodeMap.isDirtyProp(rId.value, prop);

    return {rDirty, isDirtyProp};
}

export function createRefProxy(nodeMap, rId, rNode) {

    const {rDirty, isDirtyProp} = useDirty(rId, nodeMap);
    const targetObj = reactive({node: rNode, id: rId, dirty: rDirty, isDirtyProp});

    const setHandler = (t, prop, value) => {
        nodeMap.set(rId.value, prop, value);
        return true;
    }

    const excludeProps = getExcludeProperties(targetObj);
    const getHandler = (t, prop, receiver) => {
        if (prop === "__target__") return t;
        if (prop in excludeProps) return Reflect.get(t, prop, receiver);

        if (t.node && prop in t.node) return Reflect.get(t.node, prop, receiver);
        return Reflect.get(t, prop, receiver);
    }
    return new Proxy(targetObj, {
        get: getHandler,
        set: setHandler
    });
}