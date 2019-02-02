import Snoowrap from 'snoowrap';
import { getRedditConfig } from './data';
import { Game } from './game';
import botLogger from './logger';
import BotNotification from './notification';
import Provider from './provider';
import Reddit from './reddit';

export default class RedditProvider extends Provider {
  public usernames: string[];
  public subreddit: string;
  public reddit: Snoowrap;

  constructor(usernames: string[], subreddit: string, game: Game) {
    super(`https://www.reddit.com/r/${subreddit}`, `/r/${subreddit}`, game);
    this.subreddit = subreddit;
    this.usernames = usernames;
    Reddit.init();
  }

  public async getNotifications(date?: Date, limit?: number): Promise<BotNotification[]> {
    return Reddit.getNotifications(this.subreddit, this.usernames, this.game, date, limit);
  }
}
