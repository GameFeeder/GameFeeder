import Game from '../game';
import Notification from '../notifications/notification';
import Logger from '../logger';
import { ProviderData } from '../managers/data_manager';
import { assertIsDefined } from '../util/util';

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

  public abstract async getNotifications(
    since: ProviderData,
    limit?: number,
  ): Promise<Notification[]>;

  /**
   * Gets the timestamp of the last update.
   * @param since The provider data to get the last update from.
   */
  public getLastUpdateTimestamp(since: ProviderData): Date {
    const timestamp = since.timestamp;
    assertIsDefined(timestamp, 'Timestamp not found in getLastUpdateTimestamp');
    return new Date(timestamp);
  }

  /**
   * Gets the version string of the last update.
   * @param since The provider data to get the last update from.
   */
  public getLastUpdateVersion(since: ProviderData): string | undefined {
    return since.version;
  }
}
