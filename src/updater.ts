import PubSub from 'pubsub-js';
import DataManager, { ProviderData } from './managers/data_manager';
import ConfigManager from './managers/config_manager';
import Game from './game';
import Logger from './logger';
import Notification from './notifications/notification';
import { sortLimitEnd } from './util/array_util';
import { sleep } from './util/util';

export default class Updater {
  private static updaters: Updater[];
  public static UPDATER_TOPIC = 'UPDATER_TOPIC';

  public logger: Logger;
  /** Determines if the auto updating is set to on or off. */
  private doUpdates: boolean;
  /** The delay in milliseconds between each game within an update cycle. */
  private gameIntervalMs: number;
  /** The delay in milliseconds between each update cycle. */
  private cyleIntervalMs: number;
  /** A cahce for last update data. */
  private lastUpdateCache: Map<Game, ProviderData>;

  /**
   * Creates an instance of Updater.
   * @param key Id of the updater
   * @param enabled Whether the specific updater loop should run or not
   * @param autosave Whether the specific updater should save the new data on each loop
   * @param limit Number of notifications to generate per loop
   * @param gameInterval Time between update checks in milliseconds
   * @param cycleInterval Time between loop end and loop begin in milliseconds
   */
  constructor(
    public key: string,
    public enabled: boolean,
    public autosave: boolean,
    private limit: number,
    gameInterval: number,
    cycleInterval: number,
  ) {
    const updaterName = this.key
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')
      .concat('-U');
    this.logger = new Logger(updaterName);

    const data = DataManager.getUpdaterData(this.key);

    if (!data) {
      throw Error(`No data object initialized for updater '${this.key}'`);
    }

    this.gameIntervalMs = gameInterval * 1000;
    this.cyleIntervalMs = cycleInterval * 1000;
    this.doUpdates = false;
    this.lastUpdateCache = new Map();
  }

  public static getUpdaters(): Updater[] {
    if (!this.updaters) {
      const updaterConfig = ConfigManager.getUpdatersConfig();

      // Convert the configurations to updaters
      const updaters: Updater[] = Object.keys(updaterConfig).map((key) => {
        const config = updaterConfig[key];

        return new Updater(
          key,
          config.enabled,
          config.autosave,
          config.limit,
          config.gameInterval,
          config.cycleInterval,
        );
      });

      this.updaters = updaters;
    }
    return this.updaters;
  }

  /** Starts the updater.
   * @returns {Promise<void>}
   */
  public start(): Promise<void> {
    this.logger.info('Started updater.');
    this.doUpdates = true;
    return this.updateLoop();
  }

  /** Stops the updater.
   * @returns {void}
   */
  public stop(): void {
    this.logger.info(`Stopping updater...`);
    this.doUpdates = false;
  }

  /** Run an update cycle. */
  public async update(): Promise<void> {
    const startTime = Date.now();

    const games = Game.getGames();

    for (const [index, game] of games.entries()) {
      // Delay in between game
      if (index > 0) {
        await sleep(this.gameIntervalMs);
      }

      await this.updateGame(game);
    }

    const updateDuration = Date.now() - startTime;
    this.logger.debug(`Finished update cycle in ${updateDuration} ms.`);
  }

  /**
   * Gets the timestamp of the last update.
   * @param game The Game to get the last update for.
   */
  public getLastUpdate(game: Game): ProviderData {
    // Check the cache
    const cachedData = this.lastUpdateCache.get(game);
    if (cachedData) {
      return cachedData;
    }
    // Otherwise, load the value from the data files
    let data = DataManager.getUpdaterData(this.key).lastUpdate[game.name];

    // If no provider data exist for the game yet, create it
    if (!data) {
      data = {
        timestamp: new Date().toISOString(),
      };
    }

    // If no timestamp is saved yet, save the current one in the cache
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }

    this.lastUpdateCache.set(game, data);
    return data;
  }

  /**
   * Saves the data of the last update.
   * @param game The Game to save the update for.
   * @param timestamp The timestamp of the update.
   * @param version The version name of the update.
   */
  public saveUpdate(game: Game, timestamp?: Date, version?: string): void {
    // const data = DataManager.getUpdaterData(this.key);
    const data = this.getLastUpdate(game);
    if (timestamp) {
      data.timestamp = timestamp.toISOString();
    }
    if (version) {
      data.version = version;
    }

    // Save to the file and update the cache
    this.lastUpdateCache.set(game, data);
    // If autosave is enabled, the values also get saved to the data files
    if (!this.autosave) {
      return;
    }
    DataManager.setProviderData(this.key, game.name, data);
  }

  /** Get the updates for the specified game.
   *
   * @param game - The game to get the updates for.
   */
  public async updateGame(game: Game): Promise<Notification[]> {
    const pollStartTime = Date.now();

    const provider = game.providers[this.key];
    if (!provider) {
      return [];
    }

    // Get provider data
    const providerData = this.getLastUpdate(game);
    // Get provider notifications
    let gameNotifications = await provider.getNotifications(providerData, this.limit);

    if (gameNotifications.length > 0) {
      // Only take the newest notifications
      gameNotifications = sortLimitEnd(gameNotifications, this.limit);
      const lastUpdate = gameNotifications[gameNotifications.length - 1];
      // Save last update data
      this.saveUpdate(game, lastUpdate.timestamp, lastUpdate.version);

      const pollEndTime = Date.now();
      const pollDuration = Math.abs(pollStartTime - pollEndTime);

      // Publish notification
      for (const notification of gameNotifications) {
        PubSub.publish(Updater.UPDATER_TOPIC, notification);
      }

      const notifyDuration = Date.now() - pollEndTime;

      this.logger.info(
        `Found ${gameNotifications.length} ${game.label} posts in ${pollDuration} ms, notified subs in ${notifyDuration} ms.`,
      );
    }

    return gameNotifications;
  }

  public updateHealthcheck(): void {
    const data = DataManager.getUpdaterData(this.key);
    data.healthcheckTimestamp = new Date().toISOString();
    DataManager.setUpdaterData(this.key, data);
  }

  /** Updates in the specified time interval.
   * @returns {void}
   */
  private async updateLoop(): Promise<void> {
    try {
      if (!this.doUpdates) {
        this.logger.info(`Update loop stopped.`);
        return;
      }
      // Run update cycle
      await this.update();
      // Update the healthcheck timestamp
      this.updateHealthcheck();
    } catch (error) {
      this.logger.error(`Update loop failed:\n${error}`);
    } finally {
      if (this.doUpdates) {
        // Update again after the delay
        setTimeout(() => {
          this.updateLoop();
        }, this.cyleIntervalMs);
      }
    }
  }
}
