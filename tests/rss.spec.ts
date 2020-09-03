import RSS from '../src/rss/rss';

describe('RSS', () => {
  test('should create', () => {
    const testRSS = new RSS();
    expect(testRSS).toBeDefined();
  });
});
