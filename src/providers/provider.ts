import Game from '../game';
import Notification from '../notifications/notification';
import Logger from '../logger';

export default abstract class Provider {
  public logger: Logger;

  constructor(public url: string, public label: string, public game: Game) {
    this.logger = new Logger(this.label);
  }

  public abstract async getNotifications(date?: Date, limit?: number): Promise<Notification[]>;
}
