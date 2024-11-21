/**
 * Indicates whether an object is added, overwritten, or identical to the original (src) version.
 * E.g. in a computed tree, the name of a node might have changed. A copy is made of the src node and the name change is applied to that copy, not the original object.
 * Therefore the overlay type of that node is now overwritten.
 * @type {Readonly<{ADDED: number, SRC: number, OVERWRITTEN: number}>}
 */
export const OverlayType = Object.freeze({
    SRC: 0,
    OVERWRITTEN: 1,
    ADDED: 2,
});