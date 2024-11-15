import {createComputedTree} from "@/SimpleProxyTreeBuilders.js";

export const createEmptyCompTree = (srcTree) => {
    const computeFn = jest.fn((_, __) => undefined);
    const compTree = createComputedTree(srcTree, computeFn);
    return {compTree, computeFn};
}