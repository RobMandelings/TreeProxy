export function difference(setA, setB) {
    const resultSet = new Set(setA); // Create a new set from setA
    for (const elem of setB) {
        resultSet.delete(elem); // Remove elements found in setB from resultSet
    }
    return resultSet; // Return the resulting set
}