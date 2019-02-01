import Snoowrap from 'snoowrap';
import { getRedditConfig } from './data';
import { Game } from './game';
import botLogger from './logger';
import BotNotification from './notification';
import Provider from './provider';

export default class RedditProvider extends Provider {
  public usernames: string[];
  public subreddit: string;
  public reddit: Snoowrap;

  constructor(usernames: string[], subreddit: string, game: Game) {
    super(`https://www.reddit.com/r/${subreddit}`, `/r/${subreddit}`, game);
    this.usernames = usernames;
    this.subreddit = subreddit;
    const { clientId, clientSecret, refreshToken, userAgent } = getRedditConfig();
    this.reddit = new Snoowrap({
      clientId,
      clientSecret,
      refreshToken,
      userAgent,
    });
  }

  public async getNotifications(date?: Date, limit?: number): Promise<BotNotification[]> {
    let notifications: BotNotification[] = [];

    for (const user of this.usernames) {
      // Get all new submissions in the given subreddit
      const posts = await (this.reddit
        .getUser(user)
        .getSubmissions())
        .filter((submission) => {
          const timestamp = new Date(submission.created_utc);
          return timestamp > date;
        });

      botLogger.debug(`Type of posts: ${typeof posts}`, 'RedditProvider');

      for (const post of posts) {
        // Convert the post into a notification
        const notification = new BotNotification(
          `New post by ${user}!`,
          this.game,
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
