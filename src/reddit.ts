import Snoowrap from 'snoowrap';
import { getRedditConfig } from './data';
import { Game } from './game';
import botLogger from './logger';
import BotNotification from './notification';
import NotificationElement from './notification_element';

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

      // botLogger.debug(`Getting posts from /u/${user} on /r/${subreddit}...`, 'Reddit');

      // Get all new submissions in the given subreddit
      const allPosts = await reddit.
        getUser(user).
        getSubmissions();

      const posts = allPosts.filter((submission) => {
          const timestamp = new Date(submission.created_utc * 1000);
          const isNew = timestamp > date;
          const isCorrectSub = submission.subreddit_name_prefixed === `r/${subreddit}`;
          return isNew && isCorrectSub;
        });

      for (const post of posts) {
        // Convert the post into a notification
        const notification = new BotNotification(
          game,
          `New post by ${user}!`,
          new NotificationElement(post.title, post.url),
          this.mdFromReddit(post.selftext),
          new Date(post.created_utc * 1000),
          null, // post.thumbnail,
          null,
          new NotificationElement(`/u/${user}`, `https://www.reddit.com/user/${user}`,
            'https://www.redditstatic.com/new-icon.png'),
        );
        notifications.push(notification);
      }
    }
    // Limit the length
    if (limit && notifications.length > limit) {
      notifications = notifications.slice(0, limit);
    }

    /*
    botLogger.debug(`Found ${notifications.length} posts from ` +
    `${usernames.map((user) => `/u/${user}`).join(', ')} in /r/${subreddit}.`, 'Reddit');
    */

    return notifications;
  }

  private static mdFromReddit(text: string): string {
    // User links
    text = text.replace(/\/u\/([a-zA-Z0-9]+)/, '[/u/$1](https://reddit.com/user/$1)');
    // Subreddit links
    text = text.replace(/\/r\/([a-zA-Z0-9]+)/, '[/r/$1](https://reddit.com/r/$1)');

    return text;
  }
}
