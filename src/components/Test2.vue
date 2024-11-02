<script setup>

import * as Proxies from "../assets/js/proxy_tree/RefProxy.js"
import {computed, reactive, ref, watch} from "vue";
import {useProxyWatchTest} from "../assets/js/ProxyWatchTest.js";
import {SourceNodeMap} from "../assets/js/node_map/NodeMap.js";
import {CustomNode} from "../assets/js/CustomNode.js";
// Example usage
const sourceNodeMap = reactive(new SourceNodeMap());

// Create some nodes
// const child1Id = sourceNodeMap.addNode(new CustomNode('Child 1'));
const child2Id = sourceNodeMap.addNode(new CustomNode('Child 2'));
const rootId = sourceNodeMap.addNode(new CustomNode('Root', [child2Id]));

const srcTree = Proxies.createSourceTree(sourceNodeMap, rootId);
const compTree1 = Proxies.createComputedTree(sourceNodeMap, rootId);
const compTree2 = Proxies.createComputedTree(compTree1.computedNodeMap, rootId);

const values = ref([
  computed(() => `src root: ${srcTree.name}`),
  computed(() => `children: ${srcTree}`)
//   computed(() => `comp root: ${compTree1.tree.name}`),
//   computed(() => `comp root: ${compTree2.tree.name}`),
//   computed(() => compTree1.tree.children[0]),
//   computed(() => compTree2.tree.children[0])
]);

let count = 0;
const change = () => {
  count += 1;
  compTree1.tree.name = `Supercool ${count}`;
  if (count > 5) compTree2.tree.name = `Mega cool`;
}

</script>

<template>
  <div v-for="v of values">
    {{ v }}
  </div>

  <div class="card">
    <button type="button" @click="change()">Click me: {{ compName }}</button>
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
