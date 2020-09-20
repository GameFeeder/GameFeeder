import SteamAppNews, {
  SteamNewsItem,
  SteamNewsItemResponse,
  SteamAppNewsResponse,
} from 'src/steam/steam_app_news';
import Game from 'src/game';

jest.mock('request-promise-native');

describe('Steam App News', () => {
  const now = new Date();
  const testResp: SteamNewsItemResponse = {
    gid: 1,
    title: 'testTitle',
    url: 'test.url.com',
    is_external_url: true,
    author: 'test author',
    contents: 'test contents',
    feedlabel: 'testLabel',
    date: now.valueOf(),
    feedname: 'test feed name',
    feed_type: 1,
    appid: 1,
    tags: ['tag1', 'tag2'],
  };
  const testGame = new Game(
    'testGameName',
    ['test', 'testGame', 'TG'],
    'TestGameLabel',
    '#000000',
    'https://i.imgur.com/aRVbvDh.png',
    {},
    [],
  );
  const testNewsItem = new SteamNewsItem(testResp);

  describe('SteamAppNews', () => {
    test('should handle no news', () => {
      const testEmptyNewsResponse: SteamAppNewsResponse = {
        appnews: {
          appid: 1,
          newsitems: [],
          count: 1,
        },
      };
      const testAppNews = new SteamAppNews(testEmptyNewsResponse);
      expect(testAppNews.appID).toBe(testEmptyNewsResponse.appnews.appid);
      expect(testAppNews.newsItems).toEqual([]);
      expect(testAppNews.toGameNotifications(testGame)).toEqual([]);
    });

    test('should convert app news to game notification', () => {
      const testNewsResponse: SteamAppNewsResponse = {
        appnews: {
          appid: 1,
          newsitems: [testResp],
          count: 1,
        },
      };
      const testAppNews = new SteamAppNews(testNewsResponse);
      expect(testAppNews.appID).toBe(testNewsResponse.appnews.appid);
      expect(testAppNews.newsItems).toEqual([testNewsItem]);
    });
  });
});
