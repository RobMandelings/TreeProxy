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

export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}