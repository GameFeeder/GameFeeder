import nodeFetch from 'node-fetch';
import { mocked } from 'ts-jest/utils';
import SteamAppNews, { SteamAppNewsResponse } from 'src/steam/steam_app_news';
import SteamWebAPI from 'src/steam/steam_web_api';

jest.mock('node-fetch', () => {
  return jest.fn();
});

describe('SteamWebAPI', () => {
  const fakeAppId = 1;
  const now = new Date();
  const fakeResponse: SteamAppNewsResponse = {
    appnews: {
      appid: fakeAppId,
      newsitems: [
        {
          gid: 0,
          title: 'testTitle',
          url: 'test.url.com',
          is_external_url: true,
          author: 'Test Author',
          contents: 'Test contents.',
          feedlabel: 'testlabel',
          date: now.getTime(),
          feedname: 'test_name',
          feed_type: 2,
          appid: fakeAppId,
          tags: ['tag1', 'tag2'],
        },
      ],
      count: 1,
    },
  };

  mocked(nodeFetch).mockImplementation(
    (): Promise<any> => {
      return Promise.resolve({
        json() {
          return Promise.resolve(fakeResponse);
        },
      });
    },
  );

  test('should return a SteamAppNews response', async () => {
    const res = await SteamWebAPI.getNewsForApp(fakeAppId);
    expect(res).toEqual(new SteamAppNews(fakeResponse));
  });

  test('should limit steam news based on count', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const res = await SteamWebAPI.getNewsForApp(fakeAppId, 0, tomorrow);
    expect(res).toEqual(new SteamAppNews(fakeResponse));
  });

  test('should limit steam news based on date', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // fetch.mockResponse(JSON.stringify(fakeResponse));
    const res = await SteamWebAPI.getNewsForApp(fakeAppId, 10, yesterday);
    expect(res).toEqual(new SteamAppNews(fakeResponse));
  });

  test('should use all provided feeds', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // fetch.mockResponse(JSON.stringify(fakeResponse));
    const res = await SteamWebAPI.getNewsForApp(fakeAppId, 10, yesterday, 0, ['feed1', 'feed2']);
    expect(res).toEqual(new SteamAppNews(fakeResponse));
  });
});
