import { limitStart, limitEnd } from '../src/util/array_util';

describe('ArrayUtil', () => {
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
