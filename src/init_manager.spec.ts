import InitManager from './init_manager';

describe('Init manager', () => {
  describe('missing keys', () => {
    test('simple', () => {
      const reference = { a: 'A', b: 'B', c: 'C' };
      const object = { b: 'B' };
      const expectedMissing = [['a'], ['c']];
      const actualMissing = InitManager.getMissingKeys(reference, object);

      expect(actualMissing).toEqual(expectedMissing);
    });

    test('inner', () => {
      const reference = { a: 'A', b: { d: 'D', e: 'E' }, c: 'C' };
      const object = { a: 'A', b: { e: 'E' } };
      const expectedMissing = [['b', 'd'], ['c']];
      const actualMissing = InitManager.getMissingKeys(reference, object);

      expect(actualMissing).toEqual(expectedMissing);
    });
  });

  describe('add missing keys', () => {
    test('simple', () => {
      const reference = { a: 'A', b: 'B', c: 'C' };
      const object = { b: 'B' };
      const expectedMissing = [['a'], ['c']];

      const { object: resultObject, keys: resultMissing } = InitManager.addMissingKeys(
        reference,
        object,
      );

      expect(reference).toEqual(resultObject);
      expect(resultMissing).toEqual(expectedMissing);
    });

    xtest('inner', () => {
      const reference = { a: 'A', b: { d: 'D', e: 'E' }, c: 'C' };
      const object = { a: 'A', b: { e: 'E' } };
      const expectedMissing = [['b', 'd'], ['c']];

      const { object: resultObject, keys: resultMissing } = InitManager.addMissingKeys(
        reference,
        object,
      );

      expect(reference).toEqual(resultObject);
      expect(resultMissing).toEqual(expectedMissing);
    });
  });
});
