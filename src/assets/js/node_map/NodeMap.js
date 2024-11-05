import {CustomNode} from "../CustomNode.js";
import {createReferenceProxy} from "../proxy_tree/RefProxy.js";
import {computed, reactive, ref} from "vue";

class NodeNotExistsError extends Error {
    constructor(id) {
        super(`Node ${id} doesn't exist`);
    }
}

export class NodeMap {
    constructor() {
    }

    generateId() {
        return crypto.randomUUID();
    }

    createRefNode(id) {
        return this.createRefProxy(id);
    }

    createRefProxy(initialId) {
        const rId = ref(initialId);
        const node = computed(() => {
            return this.getNode(rId.value);
        });

        const targetObj = reactive({node: node, id: rId});

        const setHandler = (t, prop, value) => {
            this.set(rId.value, prop, value);
            return true;
        }
        const getHandler = (t, prop, receiver) => {
            if (prop === "__target__") return t;

            if (t.node && prop in t.node) return Reflect.get(t.node, prop, receiver);
            return Reflect.get(t, prop, receiver);
        }
        return new Proxy(targetObj, {
            get: getHandler,
            set: setHandler
        });
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

