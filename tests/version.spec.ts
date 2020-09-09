import Version from '../src/notifications/version';

describe('Version', () => {
  describe('compareTo', () => {
    test('should be -1 when comparing 7.0 to 7.1', () => {
      const v1 = new Version('7.0');
      const v2 = new Version('7.1');

      const actual = v1.compareTo(v2);
      expect(actual).toBe(-1);
    });

    test('should be -1 when comparing 8.3 to 8.3a', () => {
      const v1 = new Version('8.3');
      const v2 = new Version('8.3a');

      const actual = v1.compareTo(v2);
      expect(actual).toBe(-1);
    });

    test('should be -1 when comparing 9.12c to 10.1a', () => {
      const v1 = new Version('9.12c');
      const v2 = new Version('10.1a');

      const actual = v1.compareTo(v2);
      expect(actual).toBe(-1);
    });

    test('should be 1 when comparing 7.1 to 7.0', () => {
      const v1 = new Version('7.1');
      const v2 = new Version('7.0');

      const actual = v1.compareTo(v2);
      expect(actual).toBe(1);
    });

    test('should be 1 when comparing 8.3a to 8.3', () => {
      const v1 = new Version('8.3a');
      const v2 = new Version('8.3');

      const actual = v1.compareTo(v2);
      expect(actual).toBe(1);
    });

    test('should be 1 when comparing 10.1a to 9.12c', () => {
      const v1 = new Version('10.1a');
      const v2 = new Version('9.12c');

      const actual = v1.compareTo(v2);
      expect(actual).toBe(1);
    });

    test('should be 0 when comparing 7.1 to 7.1', () => {
      const v1 = new Version('7.1');
      const v2 = new Version('7.1');

      const actual = v1.compareTo(v2);
      expect(actual).toBe(0);
    });

    test('should be 0 when comparing 8.3c to 8.3c', () => {
      const v1 = new Version('8.3c');
      const v2 = new Version('8.3c');

      const actual = v1.compareTo(v2);
      expect(actual).toBe(0);
    });

    test('should be 0 when comparing 0.4 to 0.4.0', () => {
      const v1 = new Version('0.4');
      const v2 = new Version('0.4.0');

      const actual = v1.compareTo(v2);
      expect(actual).toBe(0);
    });

    test('should be 0 when comparing 0.4.0 to 0.4', () => {
      const v1 = new Version('0.4.0');
      const v2 = new Version('0.4');

      const actual = v1.compareTo(v2);
      expect(actual).toBe(0);
    });
  });
});
