import Provider from './provider';
import SubredditProvider from './subreddit_provider';
import Game from '../game';
import Notification from '../notifications/notification';
import { sortLimitEnd, mapAsync, mergeArrays } from '../util/array_util';

import Updater from '../updater';

export default class RedditProvider extends Provider {
  constructor(public subredditProviders: SubredditProvider[], game: Game) {
    super(`https://www.reddit.com`, `Reddit`, game);
  }

  public async getNotifications(updater: Updater, limit?: number): Promise<Notification[]> {
    // Get the notifications from each subreddit asynchronously
    const subredditNotifications = await mapAsync(this.subredditProviders, (subreddit) =>
      subreddit.getNotifications(updater, limit),
    );

    // Merge the results
    return sortLimitEnd(mergeArrays(subredditNotifications), limit);
  }
}
