// const deepGet = (obj, path) => {
//     return path.split('.').reduce((acc, part) => acc[part], obj);
// };

import {deepSet} from "@pt/utils/deepObjectUtil.js";

test('Testing object access', () => {

    // const obj = {value: {nested: 0}};
    // const v = obj.value.nested;
    // const v2 = deepGet(obj, "value.nested.something.hello");
    // console.log("hi")

    const obj = {value: {nested: 0}};
    deepSet(obj, "value.nested", 5);
    expect(obj.value.nested).toBe(5);
})

test('Set unexisting nested object', () => {

    const obj = {value: undefined};
    deepSet(obj, "value.nested.anotherLevel", 5);
    expect(obj.value.nested.anotherLevel).toBe(5);

    deepSet(obj, "value", {nested: 0});
    expect(obj.value.nested).toBe(0);

})

test('Set object on path where null', () => {

    const obj = {value: null};
    deepSet(obj, "value.nested", 5);

})