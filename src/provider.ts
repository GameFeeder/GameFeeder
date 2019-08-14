import Game from './game';
import BotNotification from './notification';

export default abstract class Provider {
  public url: string;
  public label: string;
  public game: Game;

  constructor(url: string, label: string, game: Game) {
    this.url = url;
    this.label = label;
    this.game = game;
  }

  public abstract async getNotifications(date?: Date, limit?: number): Promise<BotNotification[]>;
}
