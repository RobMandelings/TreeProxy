import {computed} from "vue";

export function useTest(rCount) {

    const comp = computed(() => rCount.value);
    console.log(comp.value);
    rCount.value = 5;
    console.log(comp.value);
    expect(comp.value).toBe(5);
}