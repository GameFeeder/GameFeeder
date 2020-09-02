import Provider from './provider';
import SubredditProvider from './subreddit_provider';
import Game from '../game';
import Notification from '../notifications/notification';
import { sortLimitEnd } from '../util/comparable';
import { mapAsync, mergeArrays } from '../util/util';

export default class RedditProvider extends Provider {
  constructor(public subredditProviders: SubredditProvider[], game: Game) {
    super(`https://www.reddit.com`, `Reddit`, game);
  }

  public async getNotifications(date?: Date, limit?: number): Promise<Notification[]> {
    // Get the notifications from each subreddit asynchronously
    const subredditNotifications = await mapAsync(this.subredditProviders, (subreddit) =>
      subreddit.getNotifications(date, limit),
    );

    // Merge the results
    let notifications = mergeArrays(subredditNotifications);
    notifications = sortLimitEnd(notifications, limit);

    // Merge the results
    return notifications;
  }
}
