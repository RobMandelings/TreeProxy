import {CustomNode} from "../CustomNode.js";
import {createReferenceProxy} from "../proxy_tree/RefProxy.js";
import {computed, reactive, ref} from "vue";
import {getExcludeProperties} from "../Utils.js";

class NodeNotExistsError extends Error {
    constructor(id) {
        super(`Node ${id} doesn't exist`);
    }
}

function createRefProxy(nodeMap, initialId) {
    const rId = ref(initialId);
    const node = computed(() => {
        return nodeMap.getNode(rId.value);
    });

    const targetObj = reactive({node: node, id: rId});

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

export class NodeMap {
    constructor() {
    }

    isDirty(id) {
        throw new Error('Abstract method');
    }

    generateId() {
        return crypto.randomUUID();
    }

    createRefNode(id) {
        return this.createRefProxy(id);
    }

    createRefProxy(initialId) {
        return createRefProxy(this, initialId);
    }

    _addNode(node) {
    }

    set(nodeId, prop, value) {
        throw new Error("Abstract method");
    }

    addNode(node) {
        if (node == null) throw new Error("Node is null");
        const id = this._addNode(node);
        console.assert(this.getNode(id));
        return id;
    }

    replaceNode(id, node) {
        throw new Error("Abstract method");
    }

    addTree(tree) {
        let childrenIds = (tree.children?.length) ? tree.children.map(c => this.addTree(c)) : [];
        return this.addNode(new CustomNode(tree.name, childrenIds));
    }

    deleteNode(id) {
        throw new Error("Abstract method");
    }

    getNode(id) {
        throw new Error("Abstract method")
    }

    getNodeIds() {

    }

    nodeExists(id) {
        return !!this.getNode(id);
    }
}

