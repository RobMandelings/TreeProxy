import {isValidUUID} from "./Utils.js";

export class CustomNode {
    constructor(name, childrenIds) {
        this.name = name;
        this.childrenIds = childrenIds ?? [];
    }

    copy() {
        return new CustomNode(this.name, this.childrenIds);
    }

    static isValidID(id) {
        return isValidUUID(id);
    }
}