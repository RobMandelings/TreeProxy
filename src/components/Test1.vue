<script setup>

import {SourceTree} from "../assets/js/proxy_tree/SrcTree.js";
import {reactive, ref, watch} from "vue";
import {ComputedTree} from "../assets/js/proxy_tree/ComputedTree.js";

const srcTree = new SourceTree().init({name: "Root"});
const compTree = new ComputedTree(srcTree);

const test = compTree.computedNodeMap;

watch(srcTree.root, () => {
  console.log("Comp tree change");
})
let count = 0;
const change = () => {
  compTree.root.name = `Child${count++}`;
  console.log(compTree.nodeMap);
  console.log(compTree.nodeMap.getNode(compTree.root.id));
}

</script>

<template>

  <div class="card">
    <div>{{ compTree.root.name }}</div>
    <button type="button" @click="change">Click me</button>
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
