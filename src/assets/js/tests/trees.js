import {ComputedTree} from "../proxy_tree/ComputedTree.js";


export const createEmptyCompTree = (srcTree) => {
    const computeFn = jest.fn((_, __) => undefined);
    const compTree = new ComputedTree(srcTree, {}, computeFn);
    return {compTree, computeFn};
}