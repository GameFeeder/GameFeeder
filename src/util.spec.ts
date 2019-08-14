import { mapAsync, filterAsync, ObjUtil } from './util';

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

  describe('Object util', () => {
    describe('keys', () => {
      test('primative', () => {
        const obj = 'B';
        const expected: string[] = [];
        const actual = ObjUtil.keys(obj);

        expect(actual).toEqual(expected);
      });

      test('array', () => {
        const obj = ['A', 'B', 'C'];
        const expected = ['0', '1', '2'];
        const actual = ObjUtil.keys(obj);

        expect(actual).toEqual(expected);
      });
    });

    describe('get inner object', () => {
      test('simple object', () => {
        const object = { a: 'A', b: 'B' };
        const path = ['a'];
        const expected = 'A';
        const actual = ObjUtil.getInnerObject(object, path);

        expect(actual).toEqual(expected);
      });

      test('deep object', () => {
        const object = { a: 'A', b: { c: 'C', d: 'D' }, e: 'E' };
        const path = ['b', 'c'];
        const expected = 'C';
        const actual = ObjUtil.getInnerObject(object, path);

        expect(actual).toEqual(expected);
      });

      test('empty path', () => {
        const object = { a: 'A', b: { c: 'C', d: 'D' }, e: 'E' };
        const expected = { a: 'A', b: { c: 'C', d: 'D' }, e: 'E' };
        const actual = ObjUtil.getInnerObject(object);

        expect(actual).toEqual(expected);
      });
    });
  });
});
