import {isValidUUID} from "@pt/proxy_utils/Utils.js";

/**
 * The simples node object that exists. It should be extended from to add extra properties or variables.
 * This should represent the core of the data, all other properties and functionality that exist on TreeNode's
 * is derived from elsewhere.
 */
export class CoreNode {
    constructor(childrenIds = []) {
        this.childrenIds = childrenIds ?? [];
    }

    copy() {
        throw new Error("Abstract method");
    }

    static isValidId(id) {
        return isValidUUID(id);
    }

    static generateId() {
        return crypto.randomUUID();
    }

    static isValidID(id) {
        return isValidUUID(id);
    }
}
