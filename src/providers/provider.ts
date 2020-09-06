import Game from '../game';
import Notification from '../notifications/notification';
import Logger from '../logger';
import DataManager from '../managers/data_manager';
import Updater from '../updater';

export default abstract class Provider {
  public logger: Logger;
  public updateTimetamp?: Date;
  public updateVersion?: string;

  /**
   * Creates an instance of Provider.
   * @param url Source url for the provider
   * @param label Logging label for the provider
   * @param game The game that uses this provider
   */
  constructor(public url: string, public label: string, public game: Game) {
    this.logger = new Logger(this.label);
  }

  public abstract async getNotifications(updater: Updater, limit?: number): Promise<Notification[]>;

  /**
   * Saves the data of the last update.
   * @param updater The updater to save the update for.
   * @param timestamp The timestamp of the update.
   * @param version The version name of the update.
   */
  public saveUpdate(updater: Updater, timestamp: Date, version?: string): void {
    this.updateTimetamp = timestamp;
    this.updateVersion = version;

    if (updater.autosave) {
      const data = DataManager.getUpdaterData(updater.key);
      data.lastUpdate[this.game.name].timestamp = timestamp.toISOString();
      data.lastUpdate[this.game.name].version = version;
      DataManager.setUpdaterData(updater.key, data);
    }
  }

  /**
   * Gets the timestamp of the last update.
   * @param updater The updater to get the last update for.
   */
  public getLastUpdateTimestamp(updater: Updater): Date {
    const data = DataManager.getUpdaterData(updater.key);
    return new Date(data.lastUpdate[this.game.name].timestamp);
  }

  /**
   * Gets the version string of the last update.
   * @param updater The updater to get the last update for.
   */
  public getLastUpdateVersion(updater: Updater): string | undefined {
    const data = DataManager.getUpdaterData(updater.key);
    return data.lastUpdate[this.game.name].version;
  }
}
