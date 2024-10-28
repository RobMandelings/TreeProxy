<script setup>

import * as Proxies from "../assets/js/Proxies.js"
import {computed, reactive, ref, watch} from "vue";
import {useProxyWatchTest} from "../assets/js/ProxyWatchTest.js";
import {SourceNodeMap} from "../assets/js/NodeMap.js";
import {CustomNode} from "../assets/js/CustomNode.js";
import {createSourceTree} from "../assets/js/Proxies.js";

// const compTree1 = Proxies.createComputedTree(sourceNodeMap, srcTree.id);
// const compTree2 = Proxies.createComputedTree(compTree1.computedNodeMap, srcTree.id);
// const name = compTree1.tree.name;

// const values = ref([
//   computed(() => `src root: ${srcTree.name}`),
//   computed(() => `comp root: ${compTree1.tree.name}`),
//   computed(() => `comp root: ${compTree2.tree.name}`),
//   computed(() => compTree1.tree.children[0]),
//   computed(() => compTree2.tree.children[0])
// ]);

const {srcTree, sourceNodeMap} = createSourceTree(new CustomNode('Root'));
const child1Id = sourceNodeMap.addNode(new CustomNode('Child 1'));
srcTree.childrenIds = [child1Id];
watch(srcTree, (vN, vO) => {
  console.log(`Children changed`)
});

let count = 0;
const change = () => {
  count += 1;
  srcTree.children[0].name = `Hi ${count}`;
}

</script>

<template>

  <div class="card">
    <button type="button" @click="change()">Click me</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
    >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
        href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
        target="_blank"
    >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
