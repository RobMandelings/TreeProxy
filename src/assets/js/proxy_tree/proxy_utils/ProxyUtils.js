// Vue also attempts to get properties such as __v_isRef that are related to the reactive targets within the proxy
// We need to make sure that our proxies do not interfere with vue, so make sure that the __v_isRef is always called on
// TODO we need to test that all queries are limited to __v!
import {isRef} from "vue";

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

