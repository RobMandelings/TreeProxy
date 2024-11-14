/**
 * // TODO positionining might not be necessary anymore
 * Moves the group to a new position (within siblings, horizontally)
 */
movePos(newPos) {
    console.assert(typeof (newPos) === 'number', "Position should be a number");

    const pos = this.getPos();
    if (!this.parent) return;

    if (newPos < 0) newPos = 0;
    else if (newPos > (this.parent.children.length - 1)) newPos = this.parent.children.length - 1;

    if (pos === newPos) return;

    this.parent.children.splice(pos, 1);
    this.parent.children.splice(newPos, 0, this);
}

/**
 * Move the group one sibling to the left
 */
moveLeft() {
    this.movePos(this.getPos() - 1);
}

/**
 * Move the group once sibling to the right
 */
moveRight() {
    this.movePos(this.getPos() + 1);
}