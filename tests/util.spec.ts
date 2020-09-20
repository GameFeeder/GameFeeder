import { ObjUtil, StrUtil } from 'src/util/util';

describe('Util', () => {
  describe('Object util', () => {
    describe('keys', () => {
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

  describe('String util', () => {
    describe('limit string', () => {
      test('should not limit', () => {
        const testStr = 'Test message';
        const expected = 'Test message';
        const actual = StrUtil.limit(testStr, 12);

        expect(actual).toEqual(expected);
      });

      test('has to limit', () => {
        const testStr = 'Test message';
        const expected = 'Test messag';
        const actual = StrUtil.limit(testStr, 11);

        expect(actual).toEqual(expected);
      });
    });

    describe('natural limit string', () => {
      test('should not limit with default indicator', () => {
        const testStr = 'Test message';
        const expected = 'Test message';
        const actual = StrUtil.naturalLimit(testStr, 12);

        expect(actual).toEqual(expected);
      });

      test('has to limit with default indicator', () => {
        const testStr = 'Test message';
        const expected = 'Test mes...';
        const actual = StrUtil.naturalLimit(testStr, 11);

        expect(actual).toEqual(expected);
      });

      test('has to limit with custom indicator', () => {
        const testStr = 'Test message';
        const expected = 'Test  [...]';
        const actual = StrUtil.naturalLimit(testStr, 11, ' [...]');

        expect(actual).toEqual(expected);
      });

      test('with too long default indicator', () => {
        const testStr = 'Test message';

        expect(() => {
          StrUtil.naturalLimit(testStr, 2);
        }).toThrow();
      });

      test('with too long custom indicator', () => {
        const testStr = 'Test message';

        expect(() => {
          StrUtil.naturalLimit(testStr, 5, ' [...]');
        }).toThrow();
      });
    });
  });
});
