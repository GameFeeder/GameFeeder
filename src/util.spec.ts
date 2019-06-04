import { mapAsync, filterAsync } from './util';

test('mapAsync works', async () => {
  const testArray = [1, 2, 3];
  const asyncFunction = async (el: number) => el + 1;
  const rr = await mapAsync(testArray, asyncFunction);
  expect(rr).toEqual([2, 3, 4]);
});

test('filterAsync works', async () => {
  const testArray = [1, 2, 3];
  const asyncFunction = async (el: number) => el > 2;
  const rr = await filterAsync(testArray, asyncFunction);
  expect(rr).toEqual([3]);
});
