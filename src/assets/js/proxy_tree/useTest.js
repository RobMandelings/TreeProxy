import {computed} from "vue";

export function useTest(rCount) {

    console.log("Using test");

    const comp = computed(() => rCount.value + "A");
    console.log(comp.value);
    rCount.value = 5;
    console.log(comp.value);
}