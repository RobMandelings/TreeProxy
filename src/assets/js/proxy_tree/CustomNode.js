import {CoreNode} from "@pt/CoreNode.js";

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
        node.gui = this.gui;
        return node;
    }
}