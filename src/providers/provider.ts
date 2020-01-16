import Game from '../game';
import Notification from '../notifications/notification';
import Logger from '../logger';

export default abstract class Provider {
  public url: string;
  public label: string;
  public game: Game;
  public logger: Logger;

  constructor(url: string, label: string, game: Game) {
    this.url = url;
    this.label = label;
    this.game = game;
    this.logger = new Logger(this.label);
  }

  public abstract async getNotifications(date?: Date, limit?: number): Promise<Notification[]>;
}
