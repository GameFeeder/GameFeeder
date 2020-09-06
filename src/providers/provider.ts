import Game from '../game';
import Notification from '../notifications/notification';
import Logger from '../logger';
import DataManager from '../managers/data_manager';
import Updater from '../updater';

export default abstract class Provider {
  public logger: Logger;
  public updateTimestamp?: Date;
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
    // Cache the values
    this.updateTimestamp = timestamp;
    this.updateVersion = version;

    // If autosave is enabled, the values also get saved to the data files
    if (updater.autosave) {
      const data = DataManager.getUpdaterData(updater.key);
      const lastUpdate = data.lastUpdate[this.game.name] ?? {};
      lastUpdate.timestamp = timestamp.toISOString();

      if (version) {
        lastUpdate.version = version;
      }

      data.lastUpdate[this.game.name] = lastUpdate;

      DataManager.setUpdaterData(updater.key, data);
    }
  }

  /**
   * Gets the timestamp of the last update.
   * @param updater The updater to get the last update for.
   */
  public getLastUpdateTimestamp(updater: Updater): Date {
    // If a value is cached, return it
    if (this.updateTimestamp) {
      return this.updateTimestamp;
    }

    // Otherwise, load the value from the data files
    const data = DataManager.getUpdaterData(updater.key);
    const timestamp = data.lastUpdate[this.game.name]?.timestamp;

    if (timestamp) {
      return new Date(timestamp);
    }

    // If no timestamp is saved yet, save the current one and return it
    const date = new Date();
    this.saveUpdate(updater, date);

    return date;
  }

  /**
   * Gets the version string of the last update.
   * @param updater The updater to get the last update for.
   */
  public getLastUpdateVersion(updater: Updater): string | undefined {
    // If a value is cached, return it
    if (this.updateVersion) {
      return this.updateVersion;
    }

    // Otherwise, load the value from the data files
    const data = DataManager.getUpdaterData(updater.key);
    const version = data.lastUpdate[this.game.name]?.version;

    return version;
  }
}
