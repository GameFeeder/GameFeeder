import getBots from './bots/bots';
import DataManager from './managers/data_manager';
import ConfigManager from './managers/config_manager';
import Game from './game';
import Logger from './logger';
import Notification from './notifications/notification';
import { sort, sortLimitEnd } from './util/comparable';

export default class Updater {
  private static updaters: Updater[];

  public logger: Logger;
  public key: string;
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
  constructor(key: string, enabled: boolean, autosave: boolean, delaySec: number, limit: number) {
    this.key = key;
    this.logger = new Logger(`Updater (${this.key})`);

    const data = DataManager.getUpdaterData(this.key);

    if (!data) throw Error(`No data object initialized for updater '${this.key}'`);

    this.setDelaySec(delaySec);
    this.limit = limit;
    this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : new Date();
    this.doUpdates = false;
    this.enabled = enabled;
    this.autosave = autosave;
  }
  public static getUpdaters(): Updater[] {
    if (!this.updaters) {
      const updaterConfig = ConfigManager.getUpdatersConfig().updaters;

      const updaters = updaterConfig.map(
        (config) =>
          new Updater(
            config.key,
            config.enabled,
            config.autosave,
            config.updateDelaySec,
            config.limit,
          ),
      );

      this.updaters = updaters;
    }
    return this.updaters;
  }
  /** Sets the update interval in milliseconds.
   * @param {number} delayMs - The delay in milliseconds.
   */
  public setDelayMs(delayMs: number): void {
    this.updateDelayMs = delayMs;
  }
  /** Sets the update interval in seconds.
   * @param {number} delaySec - The delay in seconds.
   */
  public setDelaySec(delaySec: number): void {
    this.updateDelayMs = delaySec * 1000;
  }
  /** Sets the update interval in minutes.
   * @param {number} delayMin - The delay in minutes.
   */
  public setDelayMin(delayMin: number): void {
    this.updateDelayMs = delayMin * 60000;
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
    let notifications: Notification[] = [].concat(...gameNotifications);

    if (notifications.length > 0) {
      // Sort the notifications by their date, from old to new.
      notifications = sort(notifications);

      const endPollTime = Date.now();
      const pollTime = endPollTime - startTime;
      this.logger.info(
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
      this.logger.info(`Notified channels in ${notifyTime} ms.`);
    }
    const updateTime = Date.now() - startTime;
    this.logger.debug(`Finished update cycle in ${updateTime} ms.`);
  }

  /** Get the updates for the specified game.
   *
   * @param game - The game to get the updates for.
   */
  public async updateGame(game: Game): Promise<Notification[]> {
    const gameStartTime = Date.now();
    // Get provider notifications
    let gameNotifications =
      (await game.providers[this.key]?.getNotifications(this.lastUpdate, this.limit)) ?? [];

    if (gameNotifications.length > 0) {
      // Only take the newest notifications
      gameNotifications = sortLimitEnd(gameNotifications, this.limit);

      const gameEndTime = Date.now();
      const gameTime = Math.abs(gameStartTime - gameEndTime);
      this.logger.info(`Found ${gameNotifications.length} ${game.label} posts in ${gameTime} ms.`);
    }
    return gameNotifications;
  }

  public saveDate(date: Date): void {
    this.lastUpdate = date;
    if (this.autosave) {
      const data = DataManager.getUpdaterData(this.key);
      data.lastUpdate = date.toISOString();
      DataManager.setUpdaterData(this.key, data);
    }
  }

  public loadDate(): void {
    this.lastUpdate = new Date(DataManager.getUpdaterData(this.key).lastUpdate);
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
        }, this.updateDelayMs);
      }
    }
  }
}
