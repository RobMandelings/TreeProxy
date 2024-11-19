import {createSourceTree} from "@/SimpleProxyTreeBuilders.js";
import {CustomNode} from "@pt/CustomNode.js";

test('Hello', () => {

    const srcTree = createSourceTree({name: "hello"});
    srcTree.root.addChild(new CustomNode("Banaan", 10), 0);
    console.log("Hello");

})