import bots from './bots';
import { getUpdaterConfig, setUpdaterConfig } from './data';
import { games } from './game';
import botLogger from './logger';
import BotNotification from './notification';
import RSS from './rss';
import { limitArray } from './util';

const rss = new RSS();

class Updater {
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
  constructor(updateDelaySec: number, limit: number, lastUpdate: Date, autostart: boolean, autosave: boolean) {
    this.setDelaySec(updateDelaySec);
    this.limit = limit;
    this.lastUpdate = lastUpdate;
    this.doUpdates = false;
    this.autostart = autostart;
    this.autosave = autosave;
  }
  public debug(msg: string): void {
    botLogger.debug(msg, 'Updater');
  }
  public info(msg: string): void {
    botLogger.info(msg, 'Updater');
  }
  public warn(msg: string): void {
    botLogger.warn(msg, 'Updater');
  }
  public error(msg: string): void {
    botLogger.error(msg, 'Updater');
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
    for (const game of games) {
      const gameStartTime = Date.now();

      let gameNotifications: BotNotification[] = [];
      for (const provider of game.providers) {
        gameNotifications = gameNotifications.concat(await provider.getNotifications(this.lastUpdate, this.limit));
      }
      if (gameNotifications.length > 0) {
        // Sort the notifications
        gameNotifications.sort((a, b) => {
          return a.compare(b);
        });

        // Keep the notification count for each game in the limit.
        gameNotifications = limitArray(gameNotifications, this.limit);

        const gameEndTime = Date.now();
        const gameTime = Math.abs(gameStartTime - gameEndTime);
        this.debug(`Found ${gameNotifications.length} posts for ${game.label} in ${gameTime}ms.`);

        // Add the game notifications to the total notifications.
        notifications = notifications.concat(gameNotifications);
      }
    }
    if (notifications.length > 0) {
      // Sort the notifications by their date, from old to new.
      notifications.sort((a, b) => {
        return a.compare(b);
      });

      const endPollTime = Date.now();
      const pollTime = Math.abs(endPollTime - startTime);
      this.debug(`Found ${notifications.length} posts in ${pollTime}ms. `
      + `Notifying channels...`);

      // Update time
      this.saveDate(notifications[notifications.length - 1].timestamp);

      // Notify users
      for (const bot of bots) {
        for (const notification of notifications) {
          bot.sendMessageToGameSubs(notification.game, notification);
        }
      }
      const endNotifyTime = Date.now();
      const notifyTime = Math.abs(endNotifyTime - endPollTime);
      this.debug(`Notified channels in ${notifyTime}ms.`);
    }
  }
  public saveDate(date: Date): void {
    this.lastUpdate = date;
    if (this.autosave) {
      const data = getUpdaterConfig();
      data.updater.lastUpdate = date.toISOString();
      setUpdaterConfig(data);
    }
  }
  public loadDate(): void {
    this.lastUpdate = new Date(getUpdaterConfig().updater.lastUpdate);
  }
  /** Updates in the specified time interval.
   * @returns {void}
   */
  private async updateLoop(): Promise<void> {
    if (this.doUpdates) {
      // Update
      await this.update();
      // Update again after the delay
      setTimeout(() => { this.updateLoop(); }, this.updateDelayMs);
    }
  }
}

const updaterConfig = getUpdaterConfig().updater;

// The updater used by our main method
const updater = new Updater(
  updaterConfig.updateDelaySec,
  updaterConfig.limit,
  new Date(updaterConfig.lastUpdate),
  updaterConfig.autostart,
  updaterConfig.autosave,
);

export default updater;
