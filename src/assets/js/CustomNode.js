import {isValidUUID} from "./proxy_tree/proxy_utils/Utils.js";

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
        return new CustomNode(this.name, this.weight, this.childrenIds);
    }

    static isValidID(id) {
        return isValidUUID(id);
    }
}