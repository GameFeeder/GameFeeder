import bots from './bots';
import { games } from './game';
import botLogger from './logger';
import BotNotification from './notification';
import RSS from './rss';

const rss = new RSS();

class Updater {
  /** Determines if the auto updating is set to on or off. */
  private doUpdates: boolean;
  /** The update interval in milliseconds */
  private updateDelayMs: number;
  private lastUpdate: Date;
  private limit: number;

  /** Creates a new Updater.
   * @param {number} updateDelaySec - The initial delay in seconds.
   */
  constructor(updateDelaySec: number, limit: number, lastUpdate: Date) {
    this.setDelaySec(updateDelaySec);
    this.limit = limit;
    this.lastUpdate = lastUpdate;
    this.doUpdates = false;
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
  public async update(): Promise<void> {
    botLogger.debug('Starting update cycle...', 'Updater');

    let notifications: BotNotification[] = [];
    for (const game of games) {
      let gameNotifications: BotNotification[] = [];
      for (const provider of game.providers) {
        gameNotifications = gameNotifications.concat(await provider.getNotifications(this.lastUpdate, this.limit));
      }
      // Keep the notification count for each game in the limit
      if (this.limit > gameNotifications.length) {
        gameNotifications = gameNotifications.slice(0, this.limit);
      }
      notifications = notifications.concat(gameNotifications);
    }
    if (notifications.length > 0) {
      // Sort the notifications by their date, from old to new.
      notifications.sort((a, b) => {
        return a.compare(b);
      });

      botLogger.debug(`Found ${notifications.length} posts. Notifying users...`, 'Updater');

      // Update time
      this.lastUpdate = notifications[notifications.length - 1].timestamp;
      // Notify users
      for (const bot of bots) {
        for (const notification of notifications) {
          bot.sendMessageToGameSubs(notification.game, notification);
        }
      }
    }
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

// The updater used by our main method
const updater = new Updater(30, 3, new Date('2019-01-10'));

export default updater;
