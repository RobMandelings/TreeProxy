import {CustomNode} from "@pt/nodes/CustomNode.js";
import {useShouldExcludeProperty} from "@pt/proxy_utils/ProxyUtils.js";

export function findById(t, str) {
    if (CustomNode.isValidID(str))
        return t.asArray.find(c => c.id === str);
}

export function findByIndex(t, str) {
    if (!isNaN(str)) str = parseInt(str);
    if (typeof str === "number") return t.asArray.at(str);
}

export function findFn(t, str) {
    let res;
    res = findById(t, str);
    if (res !== undefined) return res;
    res = findByIndex(t, str)
    if (res !== undefined) return res;
}

export function decorateWithFind(nodeRelatives, customFindFn = null) {

    return new Proxy(nodeRelatives, {
        get(t, prop, receiver) {
            if (!(prop in t) && typeof prop === "string") {
                let res = customFindFn ? customFindFn(t, prop) : findFn(t, prop);
                if (res !== undefined) return res;
            }

            return Reflect.get(t, prop, receiver); // Always a Reflect.get required for vue to properly initialise reactivity and such
        }
    });
}

export function useNodeRelatives(asArrayFn) {

    /**
     * E.g. has(Vakonderdeel)
     */
    const hasFn = (criteria) => {
        if (typeof criteria === 'string') return !!getByIdFn(criteria)
        else if (typeof criteria === 'function') return !!asArrayFn().find(e => e.nodeInstanceOf(criteria));
        else throw new Error("Invalid type");
    }
    const getByIdFn = (id) => asArrayFn().find(e => e.id === id);
    const asSetFn = () => new Set(asArrayFn());
    const getSizeFn = () => asArrayFn().length;

    const findFn = (fn) => asArrayFn().find(fn);

    return {
        get asArray() {
            return asArrayFn();
        },
        get asSet() {
            return asSetFn();
        },
        has: hasFn,
        get size() {
            return getSizeFn();
        },
        get: {
            byId: getByIdFn,
        },
        find: findFn
    }
}