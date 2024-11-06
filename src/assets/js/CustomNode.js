import {isValidUUID} from "./Utils.js";

export class CustomNode {
    constructor(name, weight=0, childrenIds=[]) {
        this.name = name;
        this.weight = weight;
        this.childrenIds = childrenIds ?? [];
    }

    copy() {
        return new CustomNode(this.name, this.weight, this.childrenIds);
    }

    static isValidID(id) {
        return isValidUUID(id);
    }
}