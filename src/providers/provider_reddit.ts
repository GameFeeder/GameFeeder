import Snoowrap from 'snoowrap';
import Game from '../game';
import Notification from '../notifications/notification';
import Provider from './provider';
import Reddit from '../reddit/reddit';
import RedditUserProvider from '../reddit/reddit_user';

export default class RedditProvider extends Provider {
  public users: RedditUserProvider[];
  public subreddit: string;
  public urlFilters: string[];
  public reddit: Snoowrap;

  constructor(users: RedditUserProvider[], subreddit: string, urlFilters: string[], game: Game) {
    super(`https://www.reddit.com/r/${subreddit}`, `/r/${subreddit}`, game);
    this.subreddit = subreddit;
    this.urlFilters = urlFilters;
    this.users = users;
    Reddit.init();
  }

  public async getNotifications(date?: Date, limit?: number): Promise<Notification[]> {
    return Reddit.getNotifications(this.subreddit, this.users, this.game, date, limit);
  }
}
