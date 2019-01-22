import { Game } from './game';
import BotNotification from './notification';
import Provider from './provider';

export default class RedditProvider extends Provider {
  public username: string;
  public subreddit: string;

  constructor(username: string, subreddit: string, game: Game) {
    super(`https://www.reddit.com/user/${username}/submitted/`, `/u/${username}`, game);
    this.username = username;
    this.subreddit = subreddit;
  }

  public async getNotifications(date?: Date, limit?: number): Promise<BotNotification[]> {
    // TODO
    return [];
  }
}
