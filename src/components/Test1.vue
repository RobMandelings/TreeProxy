<script setup>

import {SourceTree} from "../assets/js/proxy_tree/SrcTree.js";
import {ComputedTree} from "../assets/js/proxy_tree/ComputedTree.js";
import {computed, ref} from "vue";

const srcTree = new SourceTree().init({name: "Root"});

let rCount = ref(0);
let triggered = 0;
let nameCount = 100;

const computeFn = (state, root) => {
  // console.log(`${state.count} en ${root.name}`);
  root.name = `${root.name} + ${state.count}`;
};

const compTree = new ComputedTree(srcTree, {count: rCount}, computeFn);

const change = () => {
  compTree.root.name = "Changed";
  rCount.value++;
}

</script>

<template>

  <div class="card">
    <div>{{ compTree.root.name }} and {{ compTree.root.weight }}</div>
    <!--    <div>{{ compTree2.root.name }} and {{ compTree2.root.weight }}</div>-->
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
