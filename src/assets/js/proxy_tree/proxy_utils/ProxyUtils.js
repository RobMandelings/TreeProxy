// Vue also attempts to get properties such as __v_isRef that are related to the reactive targets within the proxy
// We need to make sure that our proxies do not interfere with vue, so make sure that the __v_isRef is always called on
// TODO we need to test that all queries are limited to __v!
import {isRef, reactive} from "vue";

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

export function fallbackProxyGetter(target, fallbackTarget, prop, receiver) {
    const r = reactiveReflectGet(target, prop, receiver);
    if (r === undefined) return reactiveReflectGet(fallbackTarget, prop, receiver);
    else return r;
}

export function wrappedProxyTargetGetter(t, tWrapped, prop, receiver) {
    const r = reactiveReflectGet(t, prop, receiver); // First we check the wrapper target
    // It might be that r is undefined, but that it is a property in the target which results in undefined
    // E.g. t.node can be undefined, but that doesn't mean the property does not exist on the target.
    if (r !== undefined || prop in t) return reactiveGet(r);
    if (tWrapped) return reactiveReflectGet(tWrapped, prop, receiver);
    return undefined;
}

const reactiveGet = (v) => isRef(v) ? v.value : v;

export function reactiveReflectGet(t, p, receiver) {
    const res = Reflect.get(t, p, receiver);
    if (isRef(res)) return res.value;
    return res;
}

/**
 * Helper function that creates a proxy that uses common interceptions used in this system.
 * Such as ignoring vue properties and providing a __target__ property for debugging purposes.
 * @param target
 * @param handler
 * @return {*|object}
 */
export function createCustomProxy(target, handler, proxyInfo = {}) {

    /**
     * I deal with reactive targets, vue breaks some of the mechanics of default proxies.
     * E.g. when a reactive target is wrapped in a proxy, you receive all vue properties as well.
     * Such as __v_Reactive and __v_raw. Most of these things need to be ignored.
     */
    const excludePropFn = useShouldExcludeProperty(target);

    const newTarget = {__proxyInfo__: proxyInfo, ...target};

    const proxyId = crypto.randomUUID(); // Unique id for each proxy. Used in testing while comparing proxies.
    return new Proxy(newTarget, {
        get(t, prop, receiver) {
            // Otherwise vue will get the raw target upon assignment in reactive object
            // Then we will lose our Proxy! Very important line.
            if (prop === "__v_raw") return undefined;
            if (prop === "__proxyId__") return proxyId;
            if (excludePropFn(prop)) return Reflect.get(t, prop, receiver);
            const res = handler.get(t, prop, receiver);
            if (isRef(res)) return res.value; // Same mechanics as if it were a reactive object
            else return res;
        },
        set(t, p, newValue, receiver) {
            return handler.set(t, p, newValue, receiver);
        }
    })
}