import FS from 'fs';
import OS from 'os';
import Path from 'path';
import ConfigManager from 'src/managers/config_manager.js';
import DataManager, { SubscriberData, UpdatersData } from 'src/managers/data_manager.js';

const updaterConfig = {
  steam: { gameInterval: 1, cycleInterval: 10, limit: 2, enabled: true, autosave: true },
  rss: { gameInterval: 0, cycleInterval: 60, limit: 2, enabled: true, autosave: true },
};

const legacySubscriberData: SubscriberData = {
  discord: [{ gameSubs: ['dota', 'csgo'], id: '123', label: 'Test', prefix: '$', disabled: false }],
  telegram: [{ gameSubs: [], id: '456' }],
};

const legacyUpdaterData: UpdatersData = {
  steam: {
    lastUpdate: { dota: { timestamp: '2020-01-01T00:00:00.000Z', version: '7.23' } },
    healthcheckTimestamp: '2020-01-02T00:00:00.000Z',
  },
  rss: { lastUpdate: {}, healthcheckTimestamp: '' },
};

describe('Data manager', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = FS.mkdtempSync(Path.join(OS.tmpdir(), 'gamefeeder-data-'));
    DataManager.basePath = `${tempDir}/`;
    ConfigManager.getUpdatersConfig = jest.fn().mockReturnValue(updaterConfig);
  });

  afterEach(() => {
    DataManager.closeDb();
    FS.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('fresh start', () => {
    test('creates empty subscriber data', () => {
      expect(DataManager.getSubscriberData()).toEqual({ discord: [], telegram: [] });
    });

    test('seeds the configured updaters', () => {
      expect(DataManager.getUpdatersData()).toEqual({
        steam: { lastUpdate: {}, healthcheckTimestamp: '' },
        rss: { lastUpdate: {}, healthcheckTimestamp: '' },
      });
    });

    test('returns undefined for unknown updaters', () => {
      expect(DataManager.getUpdaterData('unknown')).toBeUndefined();
    });
  });

  describe('legacy JSON migration', () => {
    beforeEach(() => {
      FS.writeFileSync(
        Path.join(tempDir, 'subscriber_data.json'),
        JSON.stringify(legacySubscriberData),
      );
      FS.writeFileSync(Path.join(tempDir, 'updater_data.json'), JSON.stringify(legacyUpdaterData));
    });

    test('imports the legacy files', () => {
      expect(DataManager.getSubscriberData()).toEqual(legacySubscriberData);
      expect(DataManager.getUpdatersData()).toEqual(legacyUpdaterData);
    });

    test('renames the legacy files to .bak', () => {
      // Trigger the initialization
      DataManager.getSubscriberData();

      expect(FS.existsSync(Path.join(tempDir, 'subscriber_data.json'))).toBe(false);
      expect(FS.existsSync(Path.join(tempDir, 'updater_data.json'))).toBe(false);
      expect(FS.existsSync(Path.join(tempDir, 'subscriber_data.json.bak'))).toBe(true);
      expect(FS.existsSync(Path.join(tempDir, 'updater_data.json.bak'))).toBe(true);
    });

    test('does not import the legacy files again', () => {
      // Trigger the migration, then overwrite the imported data
      const newData: SubscriberData = { discord: [], telegram: [{ gameSubs: [], id: '789' }] };
      DataManager.setSubscriberData(newData);

      // Reopen the database, the .bak files must not be re-imported
      DataManager.closeDb();
      expect(DataManager.getSubscriberData()).toEqual(newData);
    });
  });

  describe('subscriber data', () => {
    test('persists a round-trip incl. optional fields', () => {
      const data: SubscriberData = {
        discord: [
          { gameSubs: ['dota'], id: '1', label: 'Guild', prefix: '~', disabled: true },
          { gameSubs: [], id: '2' },
        ],
        telegram: [{ gameSubs: ['csgo', 'factorio'], id: '3', disabled: false }],
      };
      DataManager.setSubscriberData(data);

      expect(DataManager.getSubscriberData()).toEqual(data);
    });

    test('removes deleted subscribers', () => {
      DataManager.setSubscriberData({
        discord: [{ gameSubs: ['dota'], id: '1' }],
        telegram: [],
      });
      DataManager.setSubscriberData({ discord: [], telegram: [] });

      expect(DataManager.getSubscriberData()).toEqual({ discord: [], telegram: [] });
    });
  });

  describe('updater data', () => {
    test('sets the data of a single updater', () => {
      const data = {
        lastUpdate: { dota: { timestamp: '2021-05-05T00:00:00.000Z' } },
        healthcheckTimestamp: '2021-05-06T00:00:00.000Z',
      };
      DataManager.setUpdaterData('steam', data);

      expect(DataManager.getUpdaterData('steam')).toEqual(data);
      // The other updaters are unaffected
      expect(DataManager.getUpdaterData('rss')).toEqual({
        lastUpdate: {},
        healthcheckTimestamp: '',
      });
    });

    test('upserts provider data', () => {
      DataManager.setProviderData('rss', 'factorio', { timestamp: '2021-01-01T00:00:00.000Z' });
      DataManager.setProviderData('rss', 'factorio', {
        timestamp: '2021-02-02T00:00:00.000Z',
        version: '1.1',
      });

      expect(DataManager.getUpdaterData('rss').lastUpdate.factorio).toEqual({
        timestamp: '2021-02-02T00:00:00.000Z',
        version: '1.1',
      });
    });
  });
});
