// Vue also attempts to get properties such as __v_isRef that are related to the reactive targets within the proxy
// We need to make sure that our proxies do not interfere with vue, so make sure that the __v_isRef is always called on
// TODO we need to test that all queries are limited to __v!
function isVueProperty(prop) {
    if (!(typeof prop === "string")) return false;
    return prop.startsWith("__v");
}

function getExcludeProperties(obj) {
    const properties = new Set();
    let currentObj = Object.getPrototypeOf(obj);
    do {
        Object.getOwnPropertyNames(currentObj).forEach(name => properties.add(name));
        Object.getOwnPropertySymbols(currentObj).forEach(symbol => properties.add(symbol));
    } while ((currentObj = Object.getPrototypeOf(currentObj)));

    return Array.from(properties);
}

export function useShouldExcludeProperty(target) {
    const excludeProps = getExcludeProperties(target);
    return (prop) => {
        if (prop in excludeProps) return true;
        return isVueProperty(prop);
    }
}

export function wrappedProxyTargetGetter(t, tWrapped, prop, receiver) {
    const r = Reflect.get(t, prop, receiver); // First we check the wrapper target
    // It might be that r is undefined, but that it is a property in the target which results in undefined
    // E.g. t.node can be undefined, but that doesn't mean the property does not exist on the target.
    if (r !== undefined || prop in t) return r;
    if (tWrapped) return Reflect.get(tWrapped, prop, receiver);
    return undefined;
}

/**
 * Helper function that creates a proxy that uses common interceptions used in this system.
 * Such as ignoring vue properties and providing a __target__ property for debugging purposes.
 * @param target
 * @param handler
 * @return {*|object}
 */
export function createCustomProxy(target, handler) {

    /**
     * I deal with reactive targets, vue breaks some of the mechanics of default proxies.
     * E.g. when a reactive target is wrapped in a proxy, you receive all vue properties as well.
     * Such as __v_Reactive and __v_raw. Most of these things need to be ignored.
     */
    const excludePropFn = useShouldExcludeProperty(target);

    const proxyId = crypto.randomUUID(); // Unique id for each proxy. Used in testing while comparing proxies.
    return new Proxy(target, {
        get(t, prop, receiver) {
            // Otherwise vue will get the raw target upon assignment in reactive object
            // Then we will lose our Proxy! Very important line.
            if (prop === "__v_raw") return undefined;
            if (prop === "__proxyId__") return proxyId;
            if (prop === "__target__") return t;
            if (excludePropFn(prop)) return Reflect.get(t, prop, receiver);
            return handler.get(t, prop, receiver);
        },
        set: handler.set
    })
}