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
    // Get all new submissions in the given subreddit
    let posts = await Reddit.getSubredditPosts(this.subreddit);
    posts = posts.filter((post) => {
      // Check if the post was made by a provider
      for (const user of this.users) {
        if (post.user === user.name) {
          return post.isValid(date, user.titleFilter, this.urlFilters);
        }
      }
      // The post is made by an unknown user
      return false;
    });

    let notifications = posts.map((post) => post.toGameNotification(this.game));

    // Limit the length
    notifications = sortLimitEnd(notifications, limit);

    return notifications;
  }
}
