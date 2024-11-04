function createTreeRec(treeObj, depth, pos) {

    if (treeObj instanceof Array) {
        return {
            name: `Node-y${depth}-x${pos}`,
            children: treeObj.map((d, i) => createTreeRec(d, depth + 1, i))
        }
    } else if (treeObj instanceof Object) {
        return {
            name: treeObj.name,
            children: treeObj.children.map((c, i) => createTreeRec(c, depth + 1, i))
        };
    } else if (typeof treeObj === "number") {
        return createTreeRec(Array.from({length: treeObj}, () => []), depth, pos);
    } else throw new Error("Not supported!");
}

export function createTree(treeObj) {
    return createTreeRec(treeObj, 0, 0);
}