import RSS from 'rss-parser';
import { botLogger } from './logger';

class Updater {
  /** Determines if the auto updating is set to on or off. */
  private doUpdates: boolean;
  /** The update interval in milliseconds */
  private updateDelayMs: number;

  /** Creates a new Updater.
   * @param {number} updateDelaySec - The initial delay in seconds.
   */
  constructor(updateDelaySec: number) {
    this.setDelaySec(updateDelaySec);
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
    // TODO
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
const updater = new Updater(30);

export { updater };
