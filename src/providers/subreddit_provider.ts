import Game from '../game';
import Notification from '../notifications/notification';
import Provider from './provider';
import Reddit from '../reddit/reddit';
import RedditUserProvider from '../reddit/reddit_user';
import { sortLimitEnd, mapAsync, mergeArrays } from '../util/array_util';

import Updater from '../updater';

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

  public async getNotifications(updater: Updater, limit?: number): Promise<Notification[]> {
    const userNotifications = await mapAsync(this.users, async (user) => {
      let userPosts = await Reddit.getUserPosts(user.name);
      // Filter out irrelevant posts
      userPosts = userPosts.filter((post) => {
        const isValid = post.isValid(
          this.getLastUpdateTimestamp(updater),
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
