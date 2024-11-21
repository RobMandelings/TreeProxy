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

export class AddChildError extends Error {
    constructor(submsg) {
        super(`Cannot add child: ${submsg}`);
    }
}

export class UndefinedIndexError extends AddChildError {
    constructor() {
        super("Index was not defined");
    }
}

export class IncorrectIndexError extends AddChildError {
    constructor(index) {
        super(`Index '${index}' is incorrect`);
    }
}

export class PosOutOfRangeError extends Error {
    constructor(pos, maxPos) {
        super(`Position ${pos} is out of range. Maximum pos: ${maxPos}`);
    }
}

export class IllegalAccessError extends Error {
    constructor(prop) {
        super(`Property '${prop}' was accessed illegally`);
    }
}