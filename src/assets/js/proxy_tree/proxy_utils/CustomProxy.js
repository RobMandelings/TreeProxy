import {isRef} from "vue";

/**
 * Indicates whether an accessed property is from Vue.
 * This happens when you wrap a proxy around a reactive target.
 * @param prop
 * @return {boolean}
 */
function isVueProperty(prop) {
    if (!(typeof prop === "string")) return false;
    return prop.startsWith("__v");
}

function getPropertiesToExclude(obj) {
    const properties = new Set();
    let currentObj = Object.getPrototypeOf(obj);
    do {
        Object.getOwnPropertyNames(currentObj).forEach(name => properties.add(name));
        Object.getOwnPropertySymbols(currentObj).forEach(symbol => properties.add(symbol));
    } while ((currentObj = Object.getPrototypeOf(currentObj)));

    return Array.from(properties);
}

/**
 * Sometimes the get trap is accessed for properties like __v_isReactive, __v_raw (properties that exist on a reactive proxy)
 */
function useShouldExcludeProperty(target) {
    const excludeProps = getPropertiesToExclude(target);
    return (prop) => {
        if (prop in excludeProps) return true;
        return isVueProperty(prop);
    }
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
            if (prop === "__proxyId__") return proxyId;
            if (prop === "__proxyInfo__") return proxyInfo;
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