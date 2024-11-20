test('Proxy tests', () => {

    const obj = {value: 2};
    const proxy = new Proxy(obj, {
        get(target, p, receiver) {
            console.log("Get")
            return Reflect.get(target, p, receiver);
        },
        set(target, p, newValue, receiver) {
            console.log("Set")
            return Reflect.set(target, p, newValue, receiver);
        }
    })

    const anotherProxy = new Proxy(proxy, {
        get(target, p, receiver) {
            console.log("get");
            return Reflect.get(target, p, receiver);
        },
        set(target, p, newValue, receiver) {
            return Reflect.set(target, p, receiver);
        }
    })

    proxy.value = 2;

})