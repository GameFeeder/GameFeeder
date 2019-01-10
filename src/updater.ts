import RSS from 'rss-parser';
import { botLogger } from './logger';

class Updater {
  private doUpdates: boolean;
  private updateDelayMs: number;

  constructor(updateDelaySec: number) {
    this.setDelaySec(updateDelaySec);
  }

  public setDelayMs(delayMs: number) {
    this.updateDelayMs = delayMs;
  }
  public setDelaySec(delaySec: number) {
    this.updateDelayMs = delaySec * 1000;
  }
  public setDelayMin(delayMin: number) {
    this.updateDelayMs = delayMin * 60000;
  }

  public async start(): Promise<void> {
    this.doUpdates = true;
    this.updateLoop();
  }
  public stop(): void {
    this.doUpdates = false;
  }
  public update(): void {
    // TODO
  }
  private async updateLoop(): Promise<void> {
    if (this.doUpdates) {
      // Update
      this.update();
      // Update again after the delay
      setTimeout(() => { this.updateLoop(); }, this.updateDelayMs);
    }
  }
}
