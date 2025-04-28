import { ProviderData } from 'src/managers/data_manager.js';
import Game from '../game.js';
import Notification from '../notifications/notification.js';
import Provider from './provider.js';
import Reddit from '../reddit/reddit.js';
import RedditUserProvider from '../reddit/reddit_user.js';
import { sortLimitEnd, mapAsync, mergeArrays } from '../util/array_util.js';

export default class SubredditProvider extends Provider {
  constructor(
    public users: RedditUserProvider[],
    public subreddit: string,
    public urlFilters: string[],
    game: Game,
  ) {
    super(`https://www.reddit.com/r/${subreddit}`, `/r/${subreddit}`, game);
    Reddit.init();
  }

  public async getNotifications(since: ProviderData, limit?: number): Promise<Notification[]> {
    const userNotifications = await mapAsync(this.users, async (user) => {
      let userPosts = await Reddit.getUserPosts(user.name);
      // Filter out irrelevant posts
      userPosts = userPosts.filter((post) => {
        const isValid = post.isValid(
          this.getLastUpdateTimestamp(since),
          user.titleFilter,
          this.urlFilters,
        );
        const isCorrectSub = post.isCorrectSub(this.subreddit);

        return isValid && isCorrectSub;
      });
      return userPosts.map((post) => post.toGameNotification(this.game));
    });

    // Combine the user notifications
    let notifications = mergeArrays(userNotifications);
    // Limit the length
    notifications = sortLimitEnd(notifications, limit);

    return notifications;
  }
}
