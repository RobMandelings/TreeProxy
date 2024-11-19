import {isEmpty} from "@pt/proxy_utils/Utils.js";

/**
 * Retrieve object value via nested property access. E.g. deepGet(obj, "value.nested");
 * @param obj
 * @param path
 * @return {*}
 */
export const deepGet = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc !== undefined ? acc[part] : undefined, obj);
};

/**
 * Set a nested property value in an object.
 * @param {Object} obj - The object to modify
 * @param {string} path - The path to the property, using dot notation
 * @param {*} value - The value to set
 * @return {boolean} - Returns true if the value was set successfully, false otherwise
 */
export const deepSet = (obj, path, value) => {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined) {
            current[parts[i]] = {};
        }
        if (typeof current[parts[i]] !== 'object') {
            return false; // Cannot set property of a non-object
        }
        current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
    return true;
};

/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 * @param {*} a - The first value to compare
 * @param {*} b - The second value to compare
 * @return {boolean} - Returns true if the values are equivalent, false otherwise
 */
export const deepEqual = (a, b) => {
    // If the values are strictly equal, return true
    if (a === b) return true;

    // If either value is null or not an object, they can't be equal
    if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false;

    // Get the keys of both objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // If the number of keys is different, they're not equal
    if (keysA.length !== keysB.length) return false;

    // Check each key in a
    for (let key of keysA) {
        // If b doesn't have the key, or the values for the key are not equal, return false
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }

    // If we've made it this far, the objects are equal
    return true;
};

/**
 * Deletes a nested property from an object and removes empty parent objects.
 * @param {Object} obj - The object to modify
 * @param {string} path - The path to the property to delete, using dot notation
 * @return {boolean} - Returns true if the property was deleted, false if the path was invalid
 */
export const deepDelete = (obj, path) => {
    const parts = path.split('.');
    let current = obj;
    const stack = [];

    // Traverse to the property to delete
    for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined) {
            return false; // Path is invalid
        }
        stack.push({object: current, key: parts[i]});
        current = current[parts[i]];
    }

    // Delete the property
    const lastPart = parts[parts.length - 1];
    if (!(lastPart in current)) {
        return false; // Property doesn't exist
    }
    delete current[lastPart];

    // Check and remove empty parent objects
    while (stack.length > 0) {
        const {object, key} = stack.pop();
        if (isEmpty(object[key])) {
            delete object[key];
        } else {
            break; // If an object is not empty, stop the process
        }
    }

    return true;
};

// TODO should not allow changes to be set when it is not part of the interface (use TypeScript!)
export function deepGetChangesToApply(prevChanges, curChanges, srcNode) {
    const changesToApply = {};

    function compareChanges(prev, cur, src, path = '') {
        // Handle removed changes
        for (const key in prev) {
            const newPath = path ? `${path}.${key}` : key;
            if (!(key in cur)) {
                const srcValue = deepGet(src, newPath);
                if (srcValue === undefined) {
                    throw new Error(`Source value for path '${newPath}' is undefined. 
                Always make sure that the source node has the correct property. Object: ${JSON.stringify(src)}`);
                }
                deepSet(changesToApply, newPath, srcValue); // Restore if the change is removed
            }
        }

        // Handle new and updated changes
        for (const key in cur) {
            const newPath = path ? `${path}.${key}` : key;
            if (!(key in prev)) {
                deepSet(changesToApply, newPath, cur[key]); // New change
            } else if (isObject(cur[key]) && isObject(prev[key])) {
                // Recursively compare nested objects
                compareChanges(prev[key], cur[key], deepGet(src, newPath), newPath);
            } else if (cur[key] !== prev[key]) {
                deepSet(changesToApply, newPath, cur[key]); // Updated change
            }
        }
    }

    compareChanges(prevChanges, curChanges, srcNode);
    return changesToApply;
}

function isObject(v) {
    return typeof v === 'object' && v !== null && !(v instanceof Array)
}

export function applyChanges(node, changes) {
    Object.entries(changes).forEach(([key, value]) => {
        if (!(key in node)) throw new Error(`Cannot apply changes: this node does not have the key ${key}`);
        if (isObject(value)) applyChanges(node[key], value);
        else node[key] = value;
    });
}