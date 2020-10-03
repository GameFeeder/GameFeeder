import mockFS from 'mock-fs';
import DotaProvider from 'src/providers/dota_provider';
import Game from 'src/game';
import { ProviderData } from 'src/managers/data_manager';

jest.mock('request-promise-native');
jest.mock('node-html-parser');
jest.mock('src/updater');
jest.mock('src/bots/bots', () => {
  return {
    getBots: () => [],
  };
});

describe('Dota Provider', () => {
  let provider: DotaProvider;

  beforeAll(() => {
    mockFS({
      data: {
        'updater_data.json': `{
          "dota": {
            "lastUpdate": {
              "dota": {
                "timestamp": "2020-05-09T07:59:54.461Z",
                "version": "7.27c"
              }
            },
            "healthcheckTimestamp": "2020-09-22T20:16:49.167Z"
          }
        }`,
      },
    });
  });

  test('should create dota provider', () => {
    provider = new DotaProvider();
    expect(provider).toBeTruthy();
  });

  test('should fail to create a dota provider when dota is not in games', () => {
    jest.spyOn(Game, 'getGames').mockReturnValue([]);
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const prov = new DotaProvider();
    }).toThrowError();
    jest.clearAllMocks();
  });

  test('should get notifications', async () => {
    jest.spyOn(provider, 'getPatchList').mockImplementation(() => {
      return ['1', '2'];
    });
    const since: ProviderData = {
      timestamp: new Date().toISOString(),
    };
    const notifications = await provider.getNotifications(since);
    expect(notifications).toBeTruthy();
  });
});
