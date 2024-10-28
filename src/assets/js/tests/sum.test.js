import {sum} from "./sum.js"

test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
})

test('adds something else', () => {
    expect(sum(1, 3)).toBe(5)
})