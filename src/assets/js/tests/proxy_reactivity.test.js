import {nextTick, reactive, watch} from "vue";

describe('Proxy reactivity', () => {

    let mockFn, obj, reactiveObj;
    beforeEach(() => {
        mockFn = jest.fn();
        obj = {value: 0};
        reactiveObj = reactive(obj);
    })

    describe('proxyReactiveObj', () => {

        let proxy;
        beforeEach(() => {
            proxy = new Proxy(reactiveObj, {});
            watch(proxy, mockFn);
        });

        test('Direct proxy change', async () => {
            proxy.value++;
            await nextTick();
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('Reactive obj change', async () => {
            reactiveObj.value++;
            await nextTick();
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    })

    test('reactiveProxy', async () => {
        const proxy = reactive(new Proxy(obj, {}));
        watch(proxy, mockFn);
        proxy.value++;
        await nextTick();
        obj.value++;
        await nextTick();
        expect(mockFn).toHaveBeenCalledTimes(1);
    })
})