import SteamWebAPI from '../src/steam/steam_web_api';

jest.mock('axios');

describe('SteamWebAPI', () => {
  test('should get news for app with defaults', async () => {
    const testAppID = 1;
    const res = await SteamWebAPI.getNewsForApp(testAppID);
    expect(res).toBeDefined();
  });
});
