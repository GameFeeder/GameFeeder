import Game from '../game';
import Notification from '../notifications/notification';
import Logger from '../logger';

export default abstract class Provider {
  public logger: Logger;

  /**
   * Creates an instance of Provider.
   * @param url Source url for the provider
   * @param label Logging label for the provider
   * @param game The game that uses this provider
   */
  constructor(public url: string, public label: string, public game: Game) {
    this.logger = new Logger(this.label);
  }

  public abstract async getNotifications(date?: Date, limit?: number): Promise<Notification[]>;
}
