import {deepGet, deepSet, isNonNullObject} from "@pt/utils/deepObjectUtil.js";

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

export function wrapInChangeUnitIfRequired(obj) {
    if (isNonNullObject(obj)) return new ChangeUnit(obj);
    return obj;
}

export function setChange(obj, path, value) {
    deepSet(obj, path, wrapInChangeUnitIfRequired(value));
}

/**
 * but this change has been reversed. So now we need to restore the value of the copy.
 * param prevChanges: these changes were applied to the copied node
 * param curChanges: all changes that should be applied on the src node to get to the node copy
 * param srcNode: the original node with all it's original properties
 *
 * E.g. prevChanges = {a: 1}, curChanges = {a: 1, b: 1} -> changesToApply: {b: 1} as a=1 is already applied on the copy
 * E.g. prevChanges = {a: 1}, curChanges = {}, srcNode has {a: 5} -> changesToApply: {a: 5}, as the copy currently has {a: 1} applied,
 */
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
                setChange(changesToApply, newPath, srcValue);// Restore if the change is removed
            }
        }

        // Handle new and updated changes
        for (const key in cur) {
            const newPath = path ? `${path}.${key}` : key;
            if (!(key in prev)) {
                deepSet(changesToApply, newPath, cur[key]); // New change
            } else if (isNonNullObject(cur[key])) {
                if (cur[key] instanceof ChangeUnit) deepSet(changesToApply, newPath, cur[key]);
                // Recursively compare nested objects
                else if (isNonNullObject(prev[key])) compareChanges(prev[key], cur[key], deepGet(src, newPath), newPath);
                else throw new Error("Can't make deep change: prev is not an object");
            } else if (cur[key] !== prev[key]) {
                deepSet(changesToApply, newPath, cur[key]); // Updated change
            }
        }
    }

    compareChanges(prevChanges, curChanges, srcNode);
    return changesToApply;
}

/**
 * Helper function that unwraps the change object such that there are no ChangeUnit values anymore.
 * @param changes
 * @return {{}}
 */
export function unwrapChangeUnits(changes) {
    if (!(typeof changes === 'object')) throw new Error(`Object value expected, not: '${changes}'`);
    const unwrapped = {};
    Object.entries(changes).forEach(([key, value]) => {
        if (value instanceof ChangeUnit) unwrapped[key] = value.value;
        else unwrapChangeUnits(value);
    })
    return unwrapped;
}