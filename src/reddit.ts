import Snoowrap from 'snoowrap';
import ConfigManager from './config_manager';
import Game from './game';
import botLogger from './bot_logger';
import BotNotification from './notification';
import NotificationElement from './notification_element';
import RedditUserProvider from './reddit_user';
import { sortLimitEnd } from './comparable';

let reddit: Snoowrap;
let isInit: boolean = false;
const loggerTag = 'Reddit';

export default class Reddit {
  public static init(): void {
    if (isInit) {
      return;
    }
    botLogger.debug('Initializing Reddit API...', 'Reddit');
    const { clientId, clientSecret, refreshToken, userAgent } = ConfigManager.getRedditConfig();
    reddit = new Snoowrap({
      clientId,
      clientSecret,
      refreshToken,
      userAgent,
    });
    botLogger.debug('Initialization successful.', 'Reddit');
    isInit = true;
  }

  public static async getNotifications(
    subreddit: string,
    users: RedditUserProvider[],
    game: Game,
    date?: Date,
    limit?: number,
  ): Promise<BotNotification[]> {
    return await this.getNotificationsFromSnoowrap(subreddit, users, game, date, limit);
  }

  public static async getNotificationsFromSnoowrap(
    subreddit: string,
    users: RedditUserProvider[],
    game: Game,
    date?: Date,
    limit?: number,
  ): Promise<BotNotification[]> {
    let notifications: BotNotification[] = [];

    if (!isInit) {
      return notifications;
    }

    for (const user of users) {
      // Get all new submissions in the given subreddit
      try {
        botLogger.debug(`Getting posts from /u/${user.name} on /r/${subreddit}...`, 'Reddit');
        const allPosts = await reddit.getUser(user.name).getSubmissions();
        const posts = allPosts.filter((submission) => {
          const timestamp = new Date(submission.created_utc * 1000);
          const isNew = timestamp > date;
          const isCorrectSub = submission.subreddit_name_prefixed === `r/${subreddit}`;
          const isValidTitle = user.titleFilter.test(submission.title);
          return isNew && isCorrectSub && isValidTitle;
        });

        for (const post of posts) {
          // Convert the post into a notification
          const notification = new BotNotification(
            game,
            `New post by ${user.name}!`,
            new NotificationElement(post.title, post.url),
            this.mdFromReddit(post.selftext),
            new Date(post.created_utc * 1000),
            null, // post.thumbnail,
            null,
            new NotificationElement(
              `/u/${user.name}`,
              `https://www.reddit.com/user/${user.name}`,
              'https://www.redditstatic.com/new-icon.png',
            ),
          );
          notifications.push(notification);
        }
      } catch (error) {
        botLogger.error(`Failed to get notification from Reddit:\n${error}`, loggerTag);
      }
    }

    // Limit the length
    notifications = sortLimitEnd(notifications, limit);

    /*
    botLogger.debug(`Found ${notifications.length} posts from ` +
    `${usernames.map((user) => `/u/${user}`).join(', ')} in /r/${subreddit}.`, 'Reddit');
    */

    return notifications;
  }

  private static mdFromReddit(text: string): string {
    let fulltext = '';
    // User links
    fulltext = text.replace(/\/u\/([a-zA-Z0-9]+)/, '[/u/$1](https://reddit.com/user/$1)');
    // Subreddit links
    fulltext = text.replace(/\/r\/([a-zA-Z0-9]+)/, '[/r/$1](https://reddit.com/r/$1)');

    return text;
  }
}
