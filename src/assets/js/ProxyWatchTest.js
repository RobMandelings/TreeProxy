import {reactive, watch} from "vue";

export function useProxyWatchTest() {

    const obj = reactive({
        value: {
            count: 0
        }
    })
    const proxyObj = new Proxy(obj, {
        get(t, prop) {
            return t[prop]
        }
    });
    const proxyObj2 = new Proxy(proxyObj, {})

    watch(proxyObj2, () => console.log("Proxy obj changed"));

    return {obj}
}