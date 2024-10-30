export class RootNotSetError extends Error {
    constructor() {
        super("Root is not yet initialised");
    }
}