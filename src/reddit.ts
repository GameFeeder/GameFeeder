import Snoowrap from 'snoowrap';
import { getRedditConfig } from './data';
import { Game } from './game';
import botLogger from './logger';
import BotNotification from './notification';

let reddit: Snoowrap;
let isInit: boolean = false;

export default class Reddit {

  public static init(): void {
    if (isInit) {
      return;
    }
    botLogger.debug('Initializing Reddit API...', 'Reddit');
    const { clientId, clientSecret, refreshToken, userAgent } = getRedditConfig();
    reddit = new Snoowrap({
      clientId,
      clientSecret,
      refreshToken,
      userAgent,
    });
    botLogger.debug('Initialization successful.', 'Reddit');
    isInit = true;
  }

  public static async getNotifications(subreddit: string, usernames: string[], game: Game,
                                       date?: Date, limit?: number): Promise<BotNotification[]> {
    return this.getNotificationsFromSnoowrap(subreddit, usernames, game, date, limit);
  }

  public static async getNotificationsFromSnoowrap(subreddit: string, usernames: string[], game: Game,
                                                   date?: Date, limit?: number): Promise<BotNotification[]> {
    let notifications: BotNotification[] = [];

    if (!isInit) {
      return notifications;
    }

    for (const user of usernames) {
      // Get all new submissions in the given subreddit
      botLogger.debug('Getting posts...', 'Reddit');
      const allPosts = await reddit.
        getUser(user).
        getSubmissions();

      botLogger.debug('Filtering posts...', 'Reddit');

      botLogger.debug(`Type of posts: ${typeof allPosts}`, 'RedditProvider');

      const posts = allPosts.filter((submission) => {
          const timestamp = new Date(submission.created_utc);
          return timestamp > date;
        });
      botLogger.debug('Getting posts succesful.');

      botLogger.debug(`Type of posts: ${typeof posts}`, 'RedditProvider');

      for (const post of posts) {
        // Convert the post into a notification
        const notification = new BotNotification(
          `New post by ${user}!`,
          game,
          post.title,
          post.url,
          `/u/${user}`,
          '0xFFFFFF',
          post.selftext,
          post.thumbnail,
          null,
          new Date(post.created_utc),
          '',
        );
        notifications.push(notification);
      }
    }
    // Limit the length
    if (limit && notifications.length > limit) {
      notifications = notifications.slice(notifications.length - limit);
    }
    return notifications;
  }
}
