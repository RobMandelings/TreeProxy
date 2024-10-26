<script setup>

import * as Proxies from "../assets/js/Proxies.js"
// Example usage
const sourceNodeMap = new Proxies.NodeMap();

// Create some nodes
const root = new Proxies.Node(1, 'Root', [2, 3]);
const child1 = new Proxies.Node(2, 'Child 1');
const child2 = new Proxies.Node(3, 'Child 2');

sourceNodeMap.addNode(root);
sourceNodeMap.addNode(child1);
sourceNodeMap.addNode(child2);

const treeRoot = Proxies.createComputedTree(sourceNodeMap, 1);
const name = treeRoot.name;

</script>

<template>
  <div>
    {{treeRoot.children[1]}}
  </div>

  <div class="card">
    <button type="button" @click="">count is {{ }}</button>
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
