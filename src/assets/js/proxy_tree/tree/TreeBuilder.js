import {ComputedTree} from "@pt/tree/computed/ComputedTree.js";
import {SourceTree} from "@pt/tree/SrcTree.js";

/**
 * Usage of builder pattern to build tree instances. This is because Tree constructors can become quite large and complex otherwise.
 * This builder lets you build a tree instance by setting parameters one by one
 */
class TreeBuilder {

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

/**
 *
 */
export class SrcProxyTreeBuilder extends TreeBuilder {

    constructor() {
        super();
        this.parseJSONTreeFn = null; // Function to parse a json tree into respective CoreNode instances (or extensions thereof)
        this.nodeMap = null; // Will be provided as argument to the source tree
        this.rootId = null; // Will be initialised internally
    }

    setParseJSONTreeFn(parseJSONTreeFn) {
        this.parseJSONTreeFn = parseJSONTreeFn;
    }

    /**
     * Creates the nodeMap and sets the rootId for the given tree.
     * @param jsonTree
     */
    initTree(jsonTree) {
        const [nodeMap, id] = this.parseJSONTreeFn(jsonTree);
        this.nodeMap = nodeMap;
        this.rootId = id;
    }

    /**
     * Building the tree instance given the initialised parameters
     */
    build() {
        const srcTree = new SourceTree(this.nodeMap, this.proxyNodeFactory);
        srcTree.init(this.rootId);
        return srcTree;
    }
}

export class ComputedProxyTreeBuilder extends TreeBuilder {

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