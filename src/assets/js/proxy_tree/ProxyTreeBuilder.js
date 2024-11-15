import {ComputedTree} from "@pt/ComputedTree.js";
import {SourceTree} from "@pt/SrcTree.js";

class ProxyTreeBuilder {

    constructor() {
        this.proxyNodeFactory = null;
    }

    setProxyNodeFactory(proxyNodeFactory) {
        this.proxyNodeFactory = proxyNodeFactory;
    }


    build() {
        throw new Error("Abstract method");
    }
}

export class SrcProxyTreeBuilder extends ProxyTreeBuilder {

    constructor() {
        super();
        this.parseJSONTreeFn = null;
        this.nodeMap = null;
        this.rootId = null;
    }

    setParseJSONTreeFn(parseJSONTreeFn) {
        this.parseJSONTreeFn = parseJSONTreeFn;
    }

    initTree(jsonTree) {
        const [nodeMap, id] = this.parseJSONTreeFn(jsonTree);
        this.nodeMap = nodeMap;
        this.rootId = id;
    }

    build() {
        const srcTree = new SourceTree(this.nodeMap, this.proxyNodeFactory);
        srcTree.init(this.rootId);
        return srcTree;
    }
}

export class ComputedProxyTreeBuilder extends ProxyTreeBuilder {

    constructor() {
        super();
        this.srcTree = null;
        this.state = {};
        this.computeFn = null;
    }

    setSrcTree(srcTree) {
        this.srcTree = srcTree;
    }

    setState(state) {
        this.state = state;
    }

    setComputeFn(computeFn) {
        this.computeFn = computeFn;
    }

    build() {
        return new ComputedTree(this.srcTree, this.state, this.computeFn, this.proxyNodeFactory);
    }
}