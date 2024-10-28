import {reactive} from "vue";
import {SourceNodeMap} from "../NodeMap.js";
import {CustomNode} from "../CustomNode.js";
import * as Proxies from "../Proxies.js";


test('hello', () => {
    const sourceNodeMap = reactive(new SourceNodeMap());
    const child2Id = sourceNodeMap.addNode(new CustomNode('Child 2'));
    const rootId = sourceNodeMap.addNode(new CustomNode('Root', [child2Id]));
    const srcTree = Proxies.createSourceTree(sourceNodeMap, rootId);


    expect(srcTree.children[0].parent.children[0].id).toBe(child2Id)

})