import {ComputedProxyTreeBuilder, SrcProxyTreeBuilder} from "@pt/ProxyTreeBuilder.js";
import {CoreNode} from "@pt/CoreNode.js";
import {CustomNode} from "@pt/CustomNode.js";
import {SourceTree} from "@pt/SrcTree.js";
import {SIMPLE_PROXY_NODE_FACTORY} from "@pt/ProxyNodeFactory.js";

function parseJSONTreeRec(tree, map) {
    let childrenIds = (tree.children?.length) ? tree.children.map(c => parseJSONTreeRec(c, map)) : [];
    const id = CoreNode.generateId();
    const node = new CustomNode(tree.name, tree.weight, childrenIds);
    map.set(id, node)
    return id;
}

const parseJSONTreeFn = (tree) => {
    const map = new Map();
    const id = parseJSONTreeRec(tree, map);
    return [map, id];
}

export function createSourceTree(jsonTree) {
    const builder = new SrcProxyTreeBuilder();
    builder.setParseJSONTreeFn(parseJSONTreeFn);
    builder.setProxyNodeFactory(SIMPLE_PROXY_NODE_FACTORY);
    builder.initTree(jsonTree);
    return builder.build();
}

export function createComputedTree(srcTree, computeFn, state = null) {
    const builder = new ComputedProxyTreeBuilder();
    builder.setProxyNodeFactory(SIMPLE_PROXY_NODE_FACTORY);
    builder.setSrcTree(srcTree);
    if (state) builder.setState(state);
    builder.setComputeFn(computeFn);
    return builder.build();
}