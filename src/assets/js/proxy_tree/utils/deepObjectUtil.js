/**
 * Retrieve object value via nested property access. E.g. deepGet(obj, "value.nested");
 * @param obj
 * @param path
 * @return {*}
 */
export const deepGet = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc[part], obj);
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
