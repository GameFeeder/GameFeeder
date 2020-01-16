import Snoowrap from 'snoowrap';
import Game from '../game';
import Notification from '../notifications/notification';
import Provider from './provider';
import Reddit from '../reddit/reddit';
import RedditUserProvider from '../reddit/reddit_user';
import { sortLimitEnd } from '../util/comparable';

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
    let notifications: Notification[] = [];

    for (const user of this.users) {
      // Get all new submissions in the given subreddit
      let posts = await Reddit.getUserPosts(user.name);
      posts = posts.filter((post) => post.isValid(date, this.subreddit, user, this.urlFilters));
      const userNotifications = posts.map((post) => post.toGameNotification(this.game));
      notifications = notifications.concat(userNotifications);
    }

    // Limit the length
    notifications = sortLimitEnd(notifications, limit);

    return notifications;
  }
}
