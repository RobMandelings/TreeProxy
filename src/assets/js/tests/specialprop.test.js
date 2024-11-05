test('', () => undefined);

// function createSpecialProperty(initialValue) {
//     let currentValue = initialValue;
//     let previousValue = initialValue;
//     let isDirty = false;
//
//     const handler = {
//         get(target, prop) {
//             if (prop === 'dirty') return isDirty;
//             if (prop === 'prev') return previousValue;
//             return currentValue;
//         },
//         set(target, prop, value) {
//             if (prop === Symbol.toPrimitive) {
//                 return () => currentValue;
//             }
//             previousValue = currentValue;
//             currentValue = value;
//             isDirty = true;
//             return true;
//         }
//     };
//
//     return new Proxy(0, handler);
// }
//
// // Usage
// const srcTree = {
//     root: {
//         score: createSpecialProperty(100)
//     }
// };
//
// test('', () => {
//     expect(srcTree.root.score).toBe(0);
// })

// console.log(srcTree.root.score); // 100
// console.log(srcTree.root.score.dirty); // false
// console.log(srcTree.root.score.prev); // 100
//
// srcTree.root.score = 150;
//
// console.log(srcTree.root.score); // 150
// console.log(srcTree.root.score.dirty); // true
// console.log(srcTree.root.score.prev); // 100
//
// // It can also be used in arithmetic operations
// console.log(srcTree.root.score + 50); // 200