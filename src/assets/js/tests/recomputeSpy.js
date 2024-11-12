// import * as originalModule from "../proxy_tree/Recompute.js"
// jest.mock()
// export function useRecomputeSpy() {
//
//     // Create a spy for the original useRecompute function
//     useRecomputeSpy = jest.spyOn(originalModule, 'useRecompute');
//
//     // Create a spy for recomputeIfDirty that will be returned by useRecompute
//     const recomputeIfDirtySpy = jest.fn();
//
//     // Mock the implementation of useRecompute to return our spy
//     useRecomputeSpy.mockImplementation((...useRecomputeArgs) => {
//         console.log("Hello");
//         const original = originalModule.useRecompute(...useRecomputeArgs);
//
//         // Wrap the original recomputeIfDirty with our spy
//         recomputeIfDirtySpy.mockImplementation((...args) => original.recomputeIfDirty(...args));
//
//         return {
//             ...original,
//             recomputeIfDirty: recomputeIfDirtySpy
//         };
//     });
//
//     return recomputeIfDirtySpy;
// }