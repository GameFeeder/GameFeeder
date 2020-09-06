import getBots from './bots/bots';
import DataManager from './managers/data_manager';
import ConfigManager from './managers/config_manager';
import Game from './game';
import Logger from './logger';
import Notification from './notifications/notification';
import { sortLimitEnd } from './util/array_util';
import { sleep, assertIsDefined } from './util/util';

export default class Updater {
  private static updaters: Updater[];

  public logger: Logger;
  /** Determines if the auto updating is set to on or off. */
  private doUpdates: boolean;
  /** The delay in milliseconds between each game within an update cycle. */
  private gameIntervalMs: number;
  /** The delay in milliseconds between each update cycle. */
  private cyleIntervalMs: number;

  /**
   * Creates an instance of Updater.
   * @param key Id of the updater
   * @param enabled Whether the specific updater loop should run or not
   * @param autosave Whether the specific updater should save the new data on each loop
   * @param limit Numver of notifications to generate per loop
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
    this.logger = new Logger(`Updater (${this.key})`);

    const data = DataManager.getUpdaterData(this.key);

    if (!data) {
      throw Error(`No data object initialized for updater '${this.key}'`);
    }

    this.gameIntervalMs = gameInterval * 1000;
    this.cyleIntervalMs = cycleInterval * 1000;
    this.doUpdates = false;
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
  public async start(): Promise<void> {
    this.doUpdates = true;
    this.updateLoop();
  }

  /** Stops the updater.
   * @returns {void}
   */
  public stop(): void {
    this.doUpdates = false;
  }

  /** Run an update cycle. */
  public async update(): Promise<void> {
    const startTime = Date.now();

    // Get game notifications
    await Game.getGames().reduce(async (prevUpdatesHandle: Promise<void>, game: Game, index) => {
      // Wait for the previous game update to finish
      await prevUpdatesHandle;

      // If this is not the first game, delay the update
      if (index !== 0) {
        await sleep(this.gameIntervalMs);
      }

      // Get the updates for the current game
      await this.updateGame(game);
    }, Promise.resolve());

    const updateDuration = Date.now() - startTime;
    this.logger.debug(`Finished update cycle in ${updateDuration} ms.`);
  }

  /** Get the updates for the specified game.
   *
   * @param game - The game to get the updates for.
   */
  public async updateGame(game: Game): Promise<Notification[]> {
    const pollStartTime = Date.now();

    const provider = game.providers[this.key];
    assertIsDefined(provider);

    // Get provider notifications
    let gameNotifications = (await provider.getNotifications(this, this.limit)) ?? [];

    if (gameNotifications.length > 0) {
      // Only take the newest notifications
      gameNotifications = sortLimitEnd(gameNotifications, this.limit);

      const pollEndTime = Date.now();
      const pollDuration = Math.abs(pollStartTime - pollEndTime);

      // Notify users
      for (const bot of getBots()) {
        for (const notification of gameNotifications) {
          // Temporary possible fix for telegram API limit
          // eslint-disable-next-line no-await-in-loop
          await bot.sendMessageToGameSubs(notification.game, notification);
        }
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
      if (this.doUpdates) {
        // Run update cycle
        await this.update();
        // Update the healthcheck timestamp
        this.updateHealthcheck();
      }
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
