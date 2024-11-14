<script setup>

import {SourceTree} from "../assets/js/proxy_tree/SrcTree.js";
import {ComputedTree} from "../assets/js/proxy_tree/ComputedTree.js";
import {computed, ref} from "vue";
import {createSourceTree} from "../assets/js/BasicSrcTree.js";

const srcTree = createSourceTree({name: "Root"});

let rCount = ref(0);
const rText = ref('');
let triggered = 0;
let nameCount = 100;

const computeFn = (state, root) => {
  const textLength = state.text.length;
  let txt;
  if (textLength >= 20) txt = state.text.replaceAll('A', 'B');
  else if (textLength >= 10) txt = state.text.length;
  else txt = state.text;
  root.name = `${root.name} (c:${state.count}, t:${txt})`
};

const compTree = new ComputedTree(srcTree, {count: rCount, text: rText}, computeFn);

const changeCount = () => {
  rCount.value++;
}

let c = 0;
const changeSrc = () => {
  srcTree.root.name = `SRC Root (${c++})`;
}

const changeAnother = () => {
  rText.value += "A";
}

</script>

<template>

  <div class="card">
    <!--    <div>{{ srcTree.root.name }}</div>-->
    <div>{{ compTree.root.name }}</div>
    <!--    <div>{{ compTree2.root.name }} and {{ compTree2.root.weight }}</div>-->
    <button type="button" @click="changeSrc">Change src</button>
    <button type="button" @click="changeCount">Change count</button>
    <button type="button" @click="changeAnother">Change text</button>
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
