import getBots from './bots';
import DataManager from './data_manager';
import ConfigManager from './config_manager';
import Game from './game';
import botLogger from './bot_logger';
import BotNotification from './notification';
import RSS from './rss';
import { sort, sortLimitEnd } from './comparable';

const loggerTag = 'Updater';

export default class Updater {
  private static updater: Updater;
  public autostart: boolean;
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

    this.setDelaySec(updaterConfig.updateDelaySec);
    this.limit = updaterConfig.limit;
    this.lastUpdate = updaterData.lastUpdate ? new Date(updaterData.lastUpdate) : new Date();
    this.doUpdates = false;
    this.autostart = updaterConfig.autostart;
    this.autosave = updaterConfig.autosave;
  }
  public static getUpdater(): Updater {
    if (!this.updater) {
      this.updater = new Updater();
    }
    return this.updater;
  }
  public debug(msg: string): void {
    botLogger.debug(msg, loggerTag);
  }
  public info(msg: string): void {
    botLogger.info(msg, loggerTag);
  }
  public warn(msg: string): void {
    botLogger.warn(msg, loggerTag);
  }
  public error(msg: string): void {
    botLogger.error(msg, loggerTag);
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
    this.debug('Starting update cycle...');

    const startTime = Date.now();

    let notifications: BotNotification[] = [];
    for (const game of Game.getGames()) {
      const gameStartTime = Date.now();

      let gameNotifications: BotNotification[] = [];
      for (const provider of game.providers) {
        gameNotifications = gameNotifications.concat(
          await provider.getNotifications(this.lastUpdate, this.limit),
        );
      }
      if (gameNotifications.length > 0) {
        // Only take the newest notifications
        gameNotifications = sortLimitEnd(gameNotifications, this.limit);

        const gameEndTime = Date.now();
        const gameTime = Math.abs(gameStartTime - gameEndTime);
        this.info(`Found ${gameNotifications.length} posts for ${game.label} in ${gameTime}ms.`);

        // Add the game notifications to the total notifications.
        notifications = notifications.concat(gameNotifications);
      }
    }
    if (notifications.length > 0) {
      // Sort the notifications by their date, from old to new.
      notifications = sort(notifications);

      const endPollTime = Date.now();
      const pollTime = Math.abs(endPollTime - startTime);
      this.info(`Found ${notifications.length} posts in ${pollTime}ms. ` + `Notifying channels...`);

      // Update time
      this.saveDate(notifications[notifications.length - 1].timestamp);

      // Notify users
      for (const bot of getBots()) {
        for (const notification of notifications) {
          bot.sendMessageToGameSubs(notification.game, notification);
        }
      }
      const endNotifyTime = Date.now();
      const notifyTime = Math.abs(endNotifyTime - endPollTime);
      this.info(`Notified channels in ${notifyTime}ms.`);
    }
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
  /** Updates in the specified time interval.
   * @returns {void}
   */
  private async updateLoop(): Promise<void> {
    try {
      if (this.doUpdates) {
        // Update
        await this.update();
        // Update again after the delay
        setTimeout(() => {
          this.updateLoop();
        }, this.updateDelayMs);
      }
    } catch (error) {
      this.error(`Update loop failed:\n${error}`);
    }
  }
}
