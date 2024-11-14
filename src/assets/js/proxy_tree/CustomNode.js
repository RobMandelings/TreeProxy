import {isValidUUID} from "@pt/proxy_utils/Utils.js";

export class CoreNode {
    constructor(childrenIds = []) {
        this.childrenIds = childrenIds ?? [];
    }

    copy() {
        throw new Error("Abstract method");
    }

    static isValidID(id) {
        return isValidUUID(id);
    }
}