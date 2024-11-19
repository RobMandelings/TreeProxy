// const deepGet = (obj, path) => {
//     return path.split('.').reduce((acc, part) => acc[part], obj);
// };

import {deepDelete, deepEqual, deepGet, deepSet} from "@pt/utils/deepObjectUtil.js";
import {isEmpty} from "@pt/proxy_utils/Utils.js";

test('Testing object access', () => {
    const obj = {value: {nested: 0}};
    deepSet(obj, "value.nested", 5);
    expect(obj.value.nested).toBe(5);
})

test('Testing deep object access', () => {

    const obj = {value: {nested: 0}};
    const v2 = deepGet(obj, "value.nested.something.hello");
    expect(v2).toBeUndefined();

    // const v = obj.value.nested;
    // console.log("hi")
})

test('Set unexisting nested object', () => {

    const obj = {value: undefined};
    deepSet(obj, "value.nested.anotherLevel", 5);
    expect(obj.value.nested.anotherLevel).toBe(5);

    deepSet(obj, "value", {nested: 0});
    expect(obj.value.nested).toBe(0);

})

test('Test objects deep equality', () => {

    const obj1 = {value: 0, nested: {value2: 5}};
    const obj2 = obj1;
    expect(deepEqual(obj1, obj2)).toBe(true);

})

test('Test objects deep equality', () => {

    const obj1 = {value: 0, nested: {value2: 5}};
    const obj2 = {value: 0, nested: {value2: 5}};
    expect(deepEqual(obj1, obj2)).toBe(true);

})

test('Test objects deep equality', () => {

    const obj1 = {value: 0, nested: {value2: 5}};
    const obj2 = {value: 1, nested: {value2: 5}};
    expect(deepEqual(obj1, obj2)).toBe(false);

})

test('Test objects deep equality', () => {

    const obj1 = {value: 0, nested: {value2: 5}};
    const obj2 = {value: 0, nested: {value2: 0}};
    expect(deepEqual(obj1, obj2)).toBe(false);

})

test('Deep equal based on primitive', () => {

    const obj1 = "5";
    const obj2 = "5";
    expect(deepEqual(obj1, obj2)).toBe(true)

})

test('Deep equal based on primitive', () => {

    const obj1 = "5";
    const obj2 = "6";
    expect(deepEqual(obj1, obj2)).toBe(false)

})

test('Deep equal based on primitive', () => {

    const obj1 = "5";
    const obj2 = 5;
    expect(deepEqual(obj1, obj2)).toBe(false)

})

test('Deep delete', () => {

    const obj = {value: {nested: {nested2: 0}}};
    deepDelete(obj, "value.nested.nested2");
    expect(isEmpty(obj)).toBe(true);

})

test('Deep delete not empty', () => {

    const obj = {value: {nested: {nested2: 0, secondNested2: 0}}};
    deepDelete(obj, "value.nested.nested2");
    expect(isEmpty(obj)).toBe(false);
    expect(isEmpty(obj.value.nested)).toBe(false);
    expect(obj.value.nested.nested2).toBeUndefined();
    deepDelete(obj, "value.nested.secondNested2");
    expect(isEmpty(obj));

})

test('Cascade delete stops in time', () => {

    const obj = {value: {nested: {nested2: 0}}, value2: 0};
    deepDelete(obj, "value.nested.nested2");
    expect(isEmpty(obj)).toBe(false);
    expect(obj.value).toBeUndefined();

})