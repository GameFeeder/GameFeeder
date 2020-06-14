import Provider from './provider';
import SubredditProvider from './subreddit_provider';
import Game from '../game';
import { mapAsync } from '../util/util';
import Notification from '../notifications/notification';
import { sortLimitEnd } from '../util/comparable';

export default class RedditProvider extends Provider {
  public subredditProviders: SubredditProvider[];

  constructor(subredditProviders: SubredditProvider[], game: Game) {
    super(`https://www.reddit.com`, `Reddit`, game);
    this.subredditProviders = subredditProviders;
  }

  public async getNotifications(date?: Date, limit?: number): Promise<Notification[]> {
    // Get the notifications from each subreddit asynchronously
    const subredditNotifications = await mapAsync(this.subredditProviders, (subreddit) =>
      subreddit.getNotifications(date, limit),
    );

    // Merge the results
    let notifications = [].concat(...subredditNotifications);
    notifications = sortLimitEnd(notifications, limit);

    // Merge the results
    return notifications;
  }
}
