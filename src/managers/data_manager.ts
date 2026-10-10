import { DatabaseSync } from 'node:sqlite';
import FS from 'fs';
import Logger from '../logger.js';
import ConfigManager from './config_manager.js';

/** The data for one subscribing channel. */
export type Subscriber = {
  /** The names of the games the channel subscribed to. */
  gameSubs: string[];
  /** The channel ID. */
  id: string;
  /** The label of the channel. */
  label?: string;
  /** The prefix the channel uses. */
  prefix?: string;
  /** Disabled subscribers won't receive automatic updates. */
  disabled?: boolean;
};

/** The data for the subscribers. */
export type SubscriberData = {
  [index: string]: Subscriber[];
  /** The discord subs. */
  discord: Subscriber[];
  /** The telegram subs. */
  telegram: Subscriber[];
};

export type ProviderData = {
  /** The timestamp of the last update. */
  timestamp?: string;
  /** The version of the last update. */
  version?: string;
};

/** The data for the updater. */
export type UpdaterData = {
  /** The data of the last update. */
  lastUpdate: {
    /** The data of the last update for the specified game. */
    [index: string]: ProviderData;
  };
  /** Timestamp of the last update cycle run */
  healthcheckTimestamp: string;
};

export type UpdatersData = {
  [index: string]: UpdaterData;
};

/** A row of the 'channels' table. */
type ChannelRow = {
  platform: string;
  channel_id: string;
  label: string | null;
  prefix: string | null;
  is_disabled: number | null;
};

/** A row of the 'subscriptions' table. */
type SubscriptionRow = {
  platform: string;
  channel_id: string;
  game: string;
};

/** A row of the 'providers' table. */
type ProviderRow = {
  name: string;
  healthcheck_at: string;
};

/** A row of the 'provider_updates' table. */
type ProviderUpdateRow = {
  provider: string;
  game: string;
  published_at: string | null;
  version: string | null;
};

/** The class managing the bot data, stored in a SQLite database. */
export default class DataManager {
  /** The base path of the data files. */
  public static basePath = 'data/';

  public static logger = new Logger('Data Manager');

  /** The file name of the SQLite database. */
  private static dbFileName = 'gamefeeder.db';
  /** The legacy JSON files that get imported into the database once. */
  private static legacyFileNames = ['subscriber_data.json', 'updater_data.json'];

  private static db?: DatabaseSync;

  /** Opens the database on first access, creating the schema,
   * importing legacy JSON data files and seeding the provider rows. */
  private static getDb(): DatabaseSync {
    if (!this.db) {
      FS.mkdirSync(this.basePath, { recursive: true });
      const db = new DatabaseSync(this.basePath + this.dbFileName);
      db.exec(
        `CREATE TABLE IF NOT EXISTS channels (
          platform    TEXT NOT NULL,
          channel_id  TEXT NOT NULL,
          label       TEXT,
          prefix      TEXT,
          is_disabled INTEGER,
          PRIMARY KEY (platform, channel_id)
        );
        CREATE TABLE IF NOT EXISTS subscriptions (
          platform   TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          game       TEXT NOT NULL,
          PRIMARY KEY (platform, channel_id, game)
        );
        CREATE TABLE IF NOT EXISTS providers (
          name           TEXT PRIMARY KEY,
          healthcheck_at TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS provider_updates (
          provider     TEXT NOT NULL,
          game         TEXT NOT NULL,
          published_at TEXT,
          version      TEXT,
          PRIMARY KEY (provider, game)
        );`,
      );
      this.db = db;
      this.importLegacyFiles();
      this.seedProviders(db);
    }
    return this.db;
  }

  /** Closes the database. It gets reopened on the next data access. */
  public static closeDb(): void {
    if (this.db) {
      this.db.close();
      this.db = undefined;
    }
  }

  /** Runs the given writes inside a single transaction. */
  private static transaction(db: DatabaseSync, writes: () => void): void {
    db.exec('BEGIN');
    try {
      writes();
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  /** Imports the legacy JSON data files into the database, once.
   * The files get renamed to '.bak' afterwards, so they are only imported once. */
  private static importLegacyFiles(): void {
    const [subscriberFile, updaterFile] = this.legacyFileNames;
    this.importLegacyFile(subscriberFile, (data) => this.setSubscriberData(data as SubscriberData));
    this.importLegacyFile(updaterFile, (data) => this.setUpdatersData(data as UpdatersData));
  }

  /** Imports a single legacy JSON data file with the given import function. */
  private static importLegacyFile(
    fileName: string,
    importData: (data: Record<string, unknown>) => void,
  ): void {
    const filePath = this.basePath + fileName;
    if (!FS.existsSync(filePath)) {
      return;
    }
    this.logger.warn(`Found legacy '${filePath}', importing it into the database.`);
    importData(JSON.parse(FS.readFileSync(filePath, 'utf8')));
    FS.renameSync(filePath, `${filePath}.bak`);
    this.logger.warn(`Imported '${filePath}' and renamed it to '${fileName}.bak'.`);
  }

  /** Ensures that a provider row exists for every configured updater. */
  private static seedProviders(db: DatabaseSync): void {
    const updaterConfig = ConfigManager.getUpdatersConfig();
    const insertProvider = db.prepare('INSERT OR IGNORE INTO providers (name) VALUES (?)');
    for (const key of Object.keys(updaterConfig)) {
      insertProvider.run(key);
    }
  }

  // Data getters and setters

  /** Gets the subscriber data as an object. */
  public static getSubscriberData(): SubscriberData {
    const db = this.getDb();
    const data: SubscriberData = { discord: [], telegram: [] };

    const channels = db
      .prepare('SELECT platform, channel_id, label, prefix, is_disabled FROM channels')
      .all() as ChannelRow[];
    const subscriptions = db
      .prepare('SELECT platform, channel_id, game FROM subscriptions')
      .all() as SubscriptionRow[];

    for (const channel of channels) {
      const subscriber: Subscriber = { gameSubs: [], id: channel.channel_id };
      if (channel.label !== null) {
        subscriber.label = channel.label;
      }
      if (channel.prefix !== null) {
        subscriber.prefix = channel.prefix;
      }
      if (channel.is_disabled !== null) {
        subscriber.disabled = channel.is_disabled !== 0;
      }
      if (!data[channel.platform]) {
        data[channel.platform] = [];
      }
      data[channel.platform].push(subscriber);
    }

    for (const subscription of subscriptions) {
      const subscriber = data[subscription.platform]?.find((sub) => {
        return sub.id === subscription.channel_id;
      });
      subscriber?.gameSubs.push(subscription.game);
    }

    return data;
  }

  /** Sets the subscriber data. */
  public static setSubscriberData(data: SubscriberData): void {
    const db = this.getDb();
    const insertChannel = db.prepare(
      `INSERT OR IGNORE INTO channels (platform, channel_id, label, prefix, is_disabled)
        VALUES (?, ?, ?, ?, ?)`,
    );
    const insertSubscription = db.prepare(
      'INSERT OR IGNORE INTO subscriptions (platform, channel_id, game) VALUES (?, ?, ?)',
    );

    this.transaction(db, () => {
      db.exec('DELETE FROM subscriptions');
      db.exec('DELETE FROM channels');

      for (const platform of Object.keys(data)) {
        for (const subscriber of data[platform]) {
          insertChannel.run(
            platform,
            subscriber.id,
            subscriber.label ?? null,
            subscriber.prefix ?? null,
            subscriber.disabled === undefined ? null : Number(subscriber.disabled),
          );
          for (const game of subscriber.gameSubs) {
            insertSubscription.run(platform, subscriber.id, game);
          }
        }
      }
    });
  }

  /** Gets the data of all updaters as an object. */
  public static getUpdatersData(): UpdatersData {
    const db = this.getDb();
    const data: UpdatersData = {};

    const providers = db
      .prepare('SELECT name, healthcheck_at FROM providers')
      .all() as ProviderRow[];
    const providerUpdates = db
      .prepare('SELECT provider, game, published_at, version FROM provider_updates')
      .all() as ProviderUpdateRow[];

    for (const provider of providers) {
      data[provider.name] = { lastUpdate: {}, healthcheckTimestamp: provider.healthcheck_at };
    }

    for (const update of providerUpdates) {
      const updaterData = data[update.provider];
      if (!updaterData) {
        continue;
      }
      const providerData: ProviderData = {};
      if (update.published_at !== null) {
        providerData.timestamp = update.published_at;
      }
      if (update.version !== null) {
        providerData.version = update.version;
      }
      updaterData.lastUpdate[update.game] = providerData;
    }

    return data;
  }

  /** Gets the data of an updater as an object. */
  public static getUpdaterData(key: string): UpdaterData {
    return this.getUpdatersData()[key];
  }

  /** Sets the data of all updaters. */
  public static setUpdatersData(data: UpdatersData): void {
    const db = this.getDb();
    this.transaction(db, () => {
      db.exec('DELETE FROM provider_updates');
      db.exec('DELETE FROM providers');
      for (const key of Object.keys(data)) {
        this.writeUpdaterData(db, key, data[key]);
      }
    });
  }

  /** Sets the data of an updater. */
  public static setUpdaterData(key: string, data: UpdaterData): void {
    const db = this.getDb();
    this.transaction(db, () => {
      db.prepare('DELETE FROM provider_updates WHERE provider = ?').run(key);
      db.prepare('DELETE FROM providers WHERE name = ?').run(key);
      this.writeUpdaterData(db, key, data);
    });
  }

  /** Writes the rows of a single updater. Must run inside a transaction. */
  private static writeUpdaterData(db: DatabaseSync, key: string, data: UpdaterData): void {
    db.prepare('INSERT OR REPLACE INTO providers (name, healthcheck_at) VALUES (?, ?)').run(
      key,
      data.healthcheckTimestamp ?? '',
    );
    const insertUpdate = db.prepare(
      `INSERT OR REPLACE INTO provider_updates (provider, game, published_at, version)
        VALUES (?, ?, ?, ?)`,
    );
    for (const game of Object.keys(data.lastUpdate ?? {})) {
      const providerData = data.lastUpdate[game];
      insertUpdate.run(key, game, providerData.timestamp ?? null, providerData.version ?? null);
    }
  }

  /** Sets the data of a provider inside an updater. */
  public static setProviderData(updaterKey: string, gameName: string, data: ProviderData): void {
    this.getDb()
      .prepare(
        `INSERT INTO provider_updates (provider, game, published_at, version) VALUES (?, ?, ?, ?)
          ON CONFLICT (provider, game)
          DO UPDATE SET published_at = excluded.published_at, version = excluded.version`,
      )
      .run(updaterKey, gameName, data.timestamp ?? null, data.version ?? null);
  }
}
