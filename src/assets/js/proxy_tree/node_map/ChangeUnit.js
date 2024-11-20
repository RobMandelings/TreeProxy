import {deepGet, deepSet, isObject} from "@pt/utils/deepObjectUtil.js";

/**
 * Used in the overlay store to determine the assigned value to some (nested) property. This is because
 * An overlay node always applies modifications to a copy (deeply).
 * Wrapper around a value to indicate this value should be assigned as a whole and that its values should not be traversed for comparison
 *
 * E.g. root.gui.style = { color: "green", "background": "yellow"}. This is an object assignment. When the overlay store applies changes to a copy, it will need to apply .gui.style.
 * Since style is an object, it might try to go even deeper and try to assign .gui.style.color and .gui.style.background. Wrapping the object in a ChangeUnit will prevent this from happening.
 * Or if style is currently set to be an instance of another class, it might not have the property "background" for example, and therefore crash upon trying to set background to "yellow".
 *
 * If the element on which the changes are applied has for example .gui.style = null, then it will try to assign .gui.null.color, .gui.null.background, which will raise errors.
 */
export class ChangeUnit {
    constructor(value) {
        this.value = value;
    }
}

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
                deepSet(changesToApply, newPath, new ChangeUnit(srcValue)); // Restore if the change is removed
            }
        }

        // Handle new and updated changes
        for (const key in cur) {
            const newPath = path ? `${path}.${key}` : key;
            if (!(key in prev)) {
                deepSet(changesToApply, newPath, cur[key]); // New change
            } else if (cur[key] instanceof ChangeUnit) {
                deepSet(changesToApply, newPath, cur[key]);
            } else if (isObject(cur[key]) && isObject(prev[key])) {
                // Recursively compare nested objects
                compareChanges(prev[key], cur[key], deepGet(src, newPath), newPath);
            }
        }
    }

    compareChanges(prevChanges, curChanges, srcNode);
    return changesToApply;
}

export function unwrapChangeUnits(changes) {
    if (!(typeof changes === 'object')) throw new Error(`Object value expected, not: '${changes}'`);
    const unwrapped = {};
    Object.entries(changes).forEach(([key, value]) => {
        if (value instanceof ChangeUnit) unwrapped[key] = value.value;
        else unwrapChangeUnits(value);
    })
    return unwrapped;
}