import Provider from './provider';
import SubredditProvider from './subreddit_provider';
import Game from '../game';
import Notification from '../notifications/notification';
import { sortLimitEnd, mapAsync, mergeArrays } from '../util/array_util';
import { ProviderData } from '../managers/data_manager';

export default class RedditProvider extends Provider {
  constructor(public subredditProviders: SubredditProvider[], game: Game) {
    super(`https://www.reddit.com`, `Reddit`, game);
  }

  public async getNotifications(since: ProviderData, limit?: number): Promise<Notification[]> {
    // Get the notifications from each subreddit asynchronously
    const subredditNotifications = await mapAsync(this.subredditProviders, (subreddit) =>
      subreddit.getNotifications(since, limit),
    );

    // Merge the results
    return sortLimitEnd(mergeArrays(subredditNotifications), limit);
  }
}
