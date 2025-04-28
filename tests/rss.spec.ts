import RSS from 'src/rss/rss.js';

describe('RSS', () => {
  test('should create', () => {
    const testRSS = new RSS();
    expect(testRSS).toBeDefined();
  });
});
