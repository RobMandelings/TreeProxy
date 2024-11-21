export class RootNotSetError extends Error {
    constructor() {
        super("Root is not yet initialised");
    }
}

export class NodeNotFoundError extends Error {
    constructor(id) {
        super(`Node with id ${id} could not be found`);
    }
}