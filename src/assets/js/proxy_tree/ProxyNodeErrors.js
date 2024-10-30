export class DirectNodeAccessError extends Error {
    constructor() {
        super("Attempted to directly access node object. This is not allowed");
    }
}

export class StaleProxyError extends Error {
    constructor() {
        super("Proxy has become stale");
    }
}

export class PosOutOfRangeError extends Error {
    constructor(pos) {
        super(`Position ${pos} is out of range`);
    }
}

export class IllegalAccessError extends Error {
    constructor(prop) {
        super(`Property '${prop}' was accessed illegally`);
    }
}