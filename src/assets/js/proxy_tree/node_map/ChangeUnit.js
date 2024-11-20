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