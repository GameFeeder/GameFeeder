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

  /** Creates a new Updater.
   * @param {number} updateDelaySec - The initial delay in seconds.
   */
  constructor(updateDelaySec: number, lastUpdate: Date) {
    this.setDelaySec(updateDelaySec);
    this.lastUpdate = lastUpdate;
    this.doUpdates = false;
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
  public update(): void {
    const notifications: BotNotification[] = [];
    for (const game of games) {
      notifications.concat(rss.getGameNotifications(game, this.lastUpdate, 3));
    }
    // Sort the notifications by their date, from old to new.
    notifications.sort((a, b) => {
      return a.compare(b);
    });
    for (const bot of bots) {
      for (const notification of notifications) {
        bot.sendMessageToGameSubs(notification.game, notification);
      }
    }
  }
  /** Updates in the specified time interval.
   * @returns {void}
   */
  private async updateLoop(): Promise<void> {
    if (this.doUpdates) {
      // Update
      this.update();
      // Update again after the delay
      setTimeout(() => { this.updateLoop(); }, this.updateDelayMs);
    }
  }
}

// The updater used by our main method
const updater = new Updater(30, new Date('2019-01-10'));

export default updater;
