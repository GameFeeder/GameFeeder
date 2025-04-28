import { mapAsync, filterAsync, naturalJoin, limitStart, limitEnd } from 'src/util/array_util.js';

describe('ArrayUtil', () => {
  describe('map async', () => {
    test('works', async () => {
      const testArray = [1, 2, 3];
      const asyncFunction = (el: number) => new Promise((resolve) => resolve(el + 1));
      const rr = await mapAsync(testArray, asyncFunction);
      expect(rr).toEqual([2, 3, 4]);
    });
  });

  describe('filter async', () => {
    test('works', async () => {
      const testArray = [1, 2, 3];
      // eslint-disable-next-line require-await
      const asyncFunction = async (el: number) => el > 2;
      const rr = await filterAsync(testArray, asyncFunction);
      expect(rr).toEqual([3]);
    });
  });

  describe('natural join', () => {
    test('undefined', () => {
      const testArray = undefined;
      const result = naturalJoin(testArray);
      expect(result).toEqual('');
    });

    test('empty', () => {
      const testArray: string[] = [];
      const result = naturalJoin(testArray);
      expect(result).toEqual('');
    });

    test('1 item', () => {
      const testArray: string[] = ['one'];
      const result = naturalJoin(testArray);
      expect(result).toEqual('one');
    });

    test('2 items', () => {
      const testArray: string[] = ['one', 'two'];
      const result = naturalJoin(testArray);
      expect(result).toEqual('one and two');
    });

    test('3 items', () => {
      const testArray: string[] = ['one', 'two', 'three'];
      const result = naturalJoin(testArray);
      expect(result).toEqual('one, two and three');
    });

    test('3 items with separator', () => {
      const testArray: string[] = ['one', 'two', 'three'];
      const result = naturalJoin(testArray, '|');
      expect(result).toEqual('one|two and three');
    });
  });

  describe('limitStart', () => {
    test('should do nothing if no limit is given', () => {
      const array = [1, 2, 3, 4, 5];
      const actual = limitStart(array);
      const expected = [1, 2, 3, 4, 5];

      expect(actual).toEqual(expected);
    });
    test('should do nothing if no limit is equal to length', () => {
      const array = [1, 2, 3, 4, 5];
      const actual = limitStart(array, 5);
      const expected = [1, 2, 3, 4, 5];

      expect(actual).toEqual(expected);
    });
    test('should do nothing if no limit is greater than length', () => {
      const array = [1, 2, 3, 4, 5];
      const actual = limitStart(array, 6);
      const expected = [1, 2, 3, 4, 5];

      expect(actual).toEqual(expected);
    });
    test('should return empty array for limit 0', () => {
      const array = [1, 2, 3, 4, 5];
      const actual = limitStart(array, 0);
      const expected: number[] = [];

      expect(actual).toEqual(expected);
    });
    test('should take the first 3 elements for limit 3', () => {
      const array = [1, 2, 3, 4, 5];
      const actual = limitStart(array, 3);
      const expected = [1, 2, 3];

      expect(actual).toEqual(expected);
    });
  });

  describe('limitEnd', () => {
    test('should do nothing if no limit is given', () => {
      const array = [1, 2, 3, 4, 5];
      const actual = limitEnd(array);
      const expected = [1, 2, 3, 4, 5];

      expect(actual).toEqual(expected);
    });
    test('should do nothing if no limit is equal to length', () => {
      const array = [1, 2, 3, 4, 5];
      const actual = limitEnd(array, 5);
      const expected = [1, 2, 3, 4, 5];

      expect(actual).toEqual(expected);
    });
    test('should do nothing if no limit is greater than length', () => {
      const array = [1, 2, 3, 4, 5];
      const actual = limitEnd(array, 6);
      const expected = [1, 2, 3, 4, 5];

      expect(actual).toEqual(expected);
    });
    test('should return empty array for limit 0', () => {
      const array = [1, 2, 3, 4, 5];
      const actual = limitEnd(array, 0);
      const expected: number[] = [];

      expect(actual).toEqual(expected);
    });
    test('should take the last 3 elements for limit 3', () => {
      const array = [1, 2, 3, 4, 5];
      const actual = limitEnd(array, 3);
      const expected = [3, 4, 5];

      expect(actual).toEqual(expected);
    });
  });
});
