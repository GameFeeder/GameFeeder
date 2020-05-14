import SteamWebAPI from './steam_web_api';

jest.mock('axios');

describe('SteamWebAPI', () => {
  test('should get news for app with defaults', () => {
    const testAppID = 1;
    SteamWebAPI.getNewsForApp(testAppID);
  });
});
