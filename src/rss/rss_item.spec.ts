import RSSItem from './rss_item';

const timeout = (ms: number) => new Promise((res) => setTimeout(res, ms));
describe('RSSItem', () => {
  test('should create two and compare', async () => {
    const before = new Date();
    await timeout(5);
    const after = new Date();
    const testFeed = {
      name: 'testFeedName',
      source: 'testSource',
      link: 'test.feed.link',
    };
    const testRSS = new RSSItem(
      'testTitle',
      'testAuthor',
      'test.link.com',
      'test content',
      before,
      testFeed,
    );
    const testRssLater = new RSSItem(
      'testTitle',
      'testAuthor',
      'test.link.com',
      'test content',
      after,
      testFeed,
    );
    expect(testRSS.compareTo(testRSS)).toBe(0);
    expect(testRSS.compareTo(testRssLater)).toBe(-1);
    expect(testRssLater.compareTo(testRSS)).toBe(1);
  });
});
