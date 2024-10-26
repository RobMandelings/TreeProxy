<script setup>

import * as Proxies from "../assets/js/Proxies.js"
import {computed, reactive, ref, watch} from "vue";
// Example usage
const sourceNodeMap = new Proxies.NodeMap();

// Create some nodes
const root = new Proxies.Node(1, 'Root', [2, 3]);
const child1 = new Proxies.Node(2, 'Child 1', [3]);
const child2 = new Proxies.Node(3, 'Child 2');

sourceNodeMap.addNode(root);
sourceNodeMap.addNode(child1);
sourceNodeMap.addNode(child2);

const srcTree = Proxies.createSourceTree(sourceNodeMap, 1);
const {compTree, computedNodeMap} = Proxies.createComputedTree(sourceNodeMap, 1);
const name = compTree.name;


// watch(() => computedNodeMap, () => console.log("Node map changed"), {deep: true});

// compTree.name = "HHell";
compTree.children[0].name = "Chicago2"

const values = ref([
  computed(() => `src root: ${srcTree.name}`),
  computed(() => `comp root: ${compTree.name}`),
  computed(() => `src root child: ${srcTree.children[0].name}`),
  computed(() => `comp root child: ${compTree.children[0].name}`),
  computed(() => compTree.children)
  // compTree.children[0].children[0].children[0].parent.parent.name,
]);

watch(() => compTree, (vN, vO) => {
  console.log(`Children changed: from ${vO} to ${vN}`)
}, {deep: true});

const compName = computed(() => compTree.name + " (computed)");

let count = 0;
const changeName = () => {
  compTree.name = `Supercool ${count++}`;
  // compTree.childrenIds = [];
  compTree.children[0].name = `Hi ${count}`;
}

// {{ compTree.children[0].children[0].parent.name }}<br>
//   {{ compTree.children[1].parent.name }}

</script>

<template>
  <div v-for="v of values">
    {{ v }}
  </div>

  <div class="card">
    <button type="button" @click="changeName()">Click me: {{ compName }}</button>
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
