import {ProxyTree} from "./ProxyTree.js";
import {reactive} from "vue";
import {SourceNodeMap} from "../node_map/SourceNodeMap.js";

export class SourceTree extends ProxyTree {

    constructor() {
        super(reactive(new SourceNodeMap()));
    }
}