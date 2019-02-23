import Snoowrap from 'snoowrap';
import { getRedditConfig } from './data';
import { Game } from './game';
import botLogger from './logger';
import BotNotification from './notification';
import Provider from './provider';
import Reddit from './reddit';
import RedditUserProvider from './reddit_user';

export default class RedditProvider extends Provider {
  public users: RedditUserProvider[];
  public subreddit: string;
  public reddit: Snoowrap;

  constructor(users: RedditUserProvider[], subreddit: string, game: Game) {
    super(`https://www.reddit.com/r/${subreddit}`, `/r/${subreddit}`, game);
    this.subreddit = subreddit;
    this.users = users;
    Reddit.init();
  }

  public async getNotifications(date?: Date, limit?: number): Promise<BotNotification[]> {
    return Reddit.getNotifications(this.subreddit, this.users, this.game, date, limit);
  }
}
