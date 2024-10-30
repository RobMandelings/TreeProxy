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