import {CoreNode} from "@pt/nodes/CoreNode.js";
import {toRaw} from "vue";

export class CustomNode extends CoreNode {
    constructor(name, weight = 0, childrenIds = []) {
        super(childrenIds);
        this.weight = weight;
        this.name = name;
        this.gui = {
            leftClick: null,
            style: null,
        }
    }

    copy() {
        const node = new CustomNode(this.name, this.weight, this.childrenIds)
        node.gui = structuredClone(toRaw(this.gui)); // toRaw in case the object is reactive, otherwise it can't clone;
        return node;
    }
}