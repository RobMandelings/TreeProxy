import {reactive} from "vue";

export function difference(setA, setB) {
    const resultSet = new Set(setA); // Create a new set from setA
    for (const elem of setB) {
        resultSet.delete(elem); // Remove elements found in setB from resultSet
    }
    return resultSet; // Return the resulting set
}

export function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
}

export function getExcludeProperties(obj) {
    const properties = new Set();
    let currentObj = Object.getPrototypeOf(obj);
    do {
        Object.getOwnPropertyNames(currentObj).forEach(name => properties.add(name));
        Object.getOwnPropertySymbols(currentObj).forEach(symbol => properties.add(symbol));
    } while ((currentObj = Object.getPrototypeOf(currentObj)));

    return Array.from(properties);
}

export function equalKeys(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // First, check if the number of keys is the same
    if (keys1.length !== keys2.length) return false;

    // Then, check if all keys in obj1 exist in obj2
    return keys1.every(key => obj2.hasOwnProperty(key));
}