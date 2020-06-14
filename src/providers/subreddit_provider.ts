import Snoowrap from 'snoowrap';
import Game from '../game';
import Notification from '../notifications/notification';
import Provider from './provider';
import Reddit from '../reddit/reddit';
import RedditUserProvider from '../reddit/reddit_user';
import { sortLimitEnd } from '../util/comparable';
import { mapAsync } from '../util/util';

export default class SubredditProvider extends Provider {
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
    const userNotifications = await mapAsync(this.users, async (user) => {
      let userPosts = await Reddit.getUserPosts(user.name);
      // Filter out irrelevant posts
      userPosts = userPosts.filter((post) => {
        const isValid = post.isValid(date, user.titleFilter, this.urlFilters);
        const isCorrectSub = post.isCorrectSub(this.subreddit);
        return isValid && isCorrectSub;
      });
      return userPosts.map((post) => post.toGameNotification(this.game));
    });

    // Combine the user notifications
    let notifications = [].concat(...userNotifications);
    // Limit the length
    notifications = sortLimitEnd(notifications, limit);

    return notifications;
  }
}
