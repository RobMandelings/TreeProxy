import {isProxy, reactive, toRaw} from "vue";
import {createSourceTree} from "@/SimpleProxyTreeBuilders.js";
import {createTree} from "@pt/TreeUtil.js";
import {CustomNode} from "@pt/CustomNode.js";

describe('Tests', () => {

    let react;
    beforeEach(() => {
        react = reactive({value: null});
    })

    test('Simple proxy test', () => {

        const p = new Proxy({}, {});
        react.value = p;
        expect(toRaw(react.value)).toBe(p);

    })

    test('ToRaw', () => {

        const p = new Proxy({}, {});
        const raw = toRaw(p);
        expect(isProxy(raw)).toBe(false);
    })

    test('ToRaw2', () => {

        const p = new Proxy(reactive({}), {});
        const raw = toRaw(p);
        expect(isProxy(raw)).toBe(false);
    })

    test('Reactive assignment', () => {

        const react = reactive({value: null});

        const p = new Proxy(reactive({}), {});
        const raw = toRaw(p);
        react.value = p;
        expect(isProxy(raw)).toBe(false);
    })

    test('Reactive assignment workaround', () => {

        const react = reactive({value: null});

        const t = {};
        const p = new Proxy(reactive({}), {
            get(target, p, receiver) {
                if (p === "__v_raw") return undefined;
                const normalResult = Reflect.get(target, p, receiver);
                return Reflect.get(target, p, receiver);
            }
        });
        const raw = toRaw(p);
        react.value = p;
        expect(isProxy(raw)).toBe(false);
    })
})
