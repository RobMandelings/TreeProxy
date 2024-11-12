

// describe('ComputeTree tests', () => {
//     let useRecomputeSpy;
//     let recomputeIfDirtySpy;
//
//     beforeEach(() => {
//         // Create a spy for the original useRecompute function
//         useRecomputeSpy = jest.spyOn(originalModule, 'useRecompute');
//
//         // Create a spy for recomputeIfDirty that will be returned by useRecompute
//         recomputeIfDirtySpy = jest.fn();
//
//         // Mock the implementation of useRecompute to return our spy
//         useRecomputeSpy.mockImplementation((state, root, recomputeFn, markOverlaysDirtyFn, resetRootFn) => {
//             const original = originalModule.useRecompute(state, root, recomputeFn, markOverlaysDirtyFn, resetRootFn);
//
//             // Wrap the original recomputeIfDirty with our spy
//             recomputeIfDirtySpy.mockImplementation((...args) => original.recomputeIfDirty(...args));
//
//             return {
//                 ...original,
//                 recomputeIfDirty: recomputeIfDirtySpy
//             };
//         });
//     });
//
//     afterEach(() => {
//         jest.restoreAllMocks();
//     });
//
//     it('should call recomputeIfDirty', () => {
//         // Your test code here
//         // ...
//
//         expect(recomputeIfDirtySpy).toHaveBeenCalled();
//     });
// });