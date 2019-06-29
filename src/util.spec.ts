import { mapAsync, filterAsync, contains } from './util';

describe('Util', () => {
  describe('map async', () => {
    test('works', async () => {
      const testArray = [1, 2, 3];
      const asyncFunction = async (el: number) => el + 1;
      const rr = await mapAsync(testArray, asyncFunction);
      expect(rr).toEqual([2, 3, 4]);
    });
  });

  describe('filter async', () => {
    test('works', async () => {
      const testArray = [1, 2, 3];
      const asyncFunction = async (el: number) => el > 2;
      const rr = await filterAsync(testArray, asyncFunction);
      expect(rr).toEqual([3]);
    });
  });

  describe('contains', () => {
    test('true', () => {
      const testArray = [1, 2, 3, 4];
      const testNumber = 3;
      const actual = contains(testArray, testNumber);

      expect(actual).toEqual(true);
    });

    test('false', () => {
      const testArray = [1, 2, 3, 4];
      const testNumber = 5;
      const actual = contains(testArray, testNumber);

      expect(actual).toEqual(false);
    });
  });
});
