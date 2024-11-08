import {isValidUUID} from "./Utils.js";

class CoreNode {
    constructor(name) {
        this.name = name;
    }
}

export class CustomNode extends CoreNode {
    constructor(name, weight = 0, childrenIds = []) {
        super(name);
        this.weight = weight;
        this.childrenIds = childrenIds ?? [];
    }

    get hi() {

    }

    copy() {
        // TODO: check the number of copies made
        console.log("Copy constructor");
        return new CustomNode(this.name, this.weight, this.childrenIds);
    }

    static isValidID(id) {
        return isValidUUID(id);
    }
}