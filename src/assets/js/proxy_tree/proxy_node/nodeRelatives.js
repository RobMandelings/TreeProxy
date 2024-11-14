import {CustomNode} from "../../CustomNode.js";
import {isValidUUID} from "../proxy_utils/Utils.js";

export function findById(t, prop) {
    if (typeof prop === 'string' && isValidUUID(prop)) {
        return t.asArray.find(c => c.id === prop);
    }
}

export function decorateNodeRelatives(nodeRelatives, customGetHandler) {
    return new Proxy(nodeRelatives, {
        get(t, prop, receiver) {
            if (prop in t) return Reflect.get(t, prop, receiver);

            const res = customGetHandler(t, prop);
            if (res !== undefined) return res;

            return Reflect.get(t, prop, receiver); // Always a Reflect.get required for vue to properly initialise reactivity and such
        }
    });
}

export function useNodeRelatives(asArrayFn) {

    const hasFn = (id) => !!getByIdFn(id);
    const getByIdFn = (id) => asArrayFn().find(e => e.id === id);
    const asSetFn = () => new Set(asArrayFn());
    const getSizeFn = () => asArrayFn().length;

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
        }
    }
}