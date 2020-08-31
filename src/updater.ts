import getBots from './bots/bots';
import DataManager from './managers/data_manager';
import ConfigManager from './managers/config_manager';
import Game from './game';
import Logger from './logger';
import Notification from './notifications/notification';
import { sort, sortLimitEnd } from './util/comparable';
import { mergeArrays } from './util/util';

export default class Updater {
  private static updater: Updater;

  public static logger = new Logger('Updater');
  public enabled: boolean;
  /** Determines if the auto updating is set to on or off. */
  private doUpdates: boolean;
  /** The update interval in milliseconds */
  private updateDelayMs: number;
  private lastUpdate: Date;
  private limit: number;
  private autosave: boolean;

  /** Creates a new Updater.
   * @param {number} updateDelaySec - The initial delay in seconds.
   */
  constructor() {
    const updaterConfig = ConfigManager.getUpdaterConfig();
    const updaterData = DataManager.getUpdaterData();

    this.updateDelayMs = this.getDelaySec(updaterConfig.updateDelaySec);
    this.limit = updaterConfig.limit;
    this.lastUpdate = updaterData.lastUpdate ? new Date(updaterData.lastUpdate) : new Date();
    this.doUpdates = false;
    this.enabled = updaterConfig.enabled;
    this.autosave = updaterConfig.autosave;
  }
  public static getUpdater(): Updater {
    if (!this.updater) {
      this.updater = new Updater();
    }
    return this.updater;
  }
  /** Gets the update interval in seconds.
   * @param {number} delaySec - The delay in seconds.
   */
  public getDelaySec(delaySec: number): number {
    return delaySec * 1000;
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

    // Get game notifications concurrently
    const handles = Game.getGames().map((game) => this.updateGame(game));

    // Combine the game notifications
    const gameNotifications = await Promise.all(handles);
    let notifications = mergeArrays(gameNotifications);

    if (notifications.length > 0) {
      // Sort the notifications by their date, from old to new.
      notifications = sort(notifications);

      const endPollTime = Date.now();
      const pollTime = endPollTime - startTime;
      Updater.logger.info(
        `Found ${notifications.length} posts in ${pollTime} ms. Notifying channels...`,
      );

      // Update time
      this.saveDate(notifications[notifications.length - 1].timestamp);

      // Notify users
      for (const bot of getBots()) {
        for (const notification of notifications) {
          // Temporary possible fix for telegram API limit
          // eslint-disable-next-line no-await-in-loop
          await bot.sendMessageToGameSubs(notification.game, notification);
        }
      }
      const notifyTime = Date.now() - endPollTime;
      Updater.logger.info(`Notified channels in ${notifyTime} ms.`);
    }
    const updateTime = Date.now() - startTime;
    Updater.logger.debug(`Finished update cycle in ${updateTime} ms.`);
  }

  /** Get the updates for the specified game.
   *
   * @param game - The game to get the updates for.
   */
  public async updateGame(game: Game): Promise<Notification[]> {
    const gameStartTime = Date.now();
    // Get provider notifications concurrently
    const handles = game.providers.map((provider) =>
      provider.getNotifications(this.lastUpdate, this.limit),
    );

    // Combine the provider notifications
    const providerNotifications = await Promise.all(handles);
    let gameNotifications = mergeArrays(providerNotifications);

    if (gameNotifications.length > 0) {
      // Only take the newest notifications
      gameNotifications = sortLimitEnd(gameNotifications, this.limit);

      const gameEndTime = Date.now();
      const gameTime = Math.abs(gameStartTime - gameEndTime);
      Updater.logger.info(
        `Found ${gameNotifications.length} ${game.label} posts in ${gameTime} ms.`,
      );
    }
    return gameNotifications;
  }

  public saveDate(date: Date): void {
    this.lastUpdate = date;
    if (this.autosave) {
      const data = DataManager.getUpdaterData();
      data.lastUpdate = date.toISOString();
      DataManager.setUpdaterData(data);
    }
  }

  public loadDate(): void {
    this.lastUpdate = new Date(DataManager.getUpdaterData().lastUpdate);
  }

  public updateHealthcheck(): void {
    const data = DataManager.getUpdaterData();
    data.healthcheckTimestamp = new Date().toISOString();
    DataManager.setUpdaterData(data);
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
      Updater.logger.error(`Update loop failed:\n${error}`);
    } finally {
      if (this.doUpdates) {
        // Update again after the delay
        setTimeout(() => {
          this.updateLoop();
        }, this.updateDelayMs);
      }
    }
  }
}
