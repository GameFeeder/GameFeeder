import InitManager from './init_manager';

describe('Init manager', () => {
  describe('missing keys', () => {
    test('simple', () => {
      const reference = { a: 'a', b: 'b', c: 'c' };
      const object = { b: 'b' };
      const expectedMissing = [['a'], ['c']];
      const actualMissing = InitManager.getMissingKeys(reference, object);

      expect(actualMissing).toEqual(expectedMissing);
    });

    test('inner', () => {
      const reference = { a: 'a', b: { d: 'd', e: 'e' }, c: 'c' };
      const object = { a: 'a', b: { e: 'e' } };
      const expectedMissing = [['b', 'd'], ['c']];
      const actualMissing = InitManager.getMissingKeys(reference, object);

      expect(actualMissing).toEqual(expectedMissing);
    });
  });
});
