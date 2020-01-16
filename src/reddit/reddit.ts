import Snoowrap from 'snoowrap';
import ConfigManager from '../managers/config_manager';
import Game from '../game';
import Notification from '../notifications/notification';
import NotificationElement from '../notifications/notification_element';
import RedditUserProvider from './reddit_user';
import { sortLimitEnd } from '../util/comparable';
import ProjectManager from '../managers/project_manager';
import Logger from '../logger';
import RedditPost from './reddit_post';

let reddit: Snoowrap;
let isInit: boolean = false;
let isEnabled: boolean = true;

export default class Reddit {
  public static logger = new Logger('Reddit');
  public static init(): void {
    if (isInit) {
      return;
    }
    Reddit.logger.debug('Initializing Reddit API...');
    const redditConfig = ConfigManager.getRedditConfig();
    const { enabled, clientId, clientSecret, refreshToken, userName } = redditConfig;

    if (!enabled) {
      isEnabled = false;
      isInit = true;

      Reddit.logger.debug('Autostart disabled.');
      return;
    }

    // Check for parameters
    const missingParams = [];
    if (!clientId) {
      missingParams.push('clientId');
    }
    if (!clientSecret) {
      missingParams.push('clientSecret');
    }
    if (!refreshToken) {
      missingParams.push('refreshToken');
    }
    if (!userName) {
      missingParams.push('userName');
    }
    if (missingParams.length > 0) {
      Reddit.logger.warn(
        `Missing parameters in 'api_config.json': ${missingParams.join(', ')}` +
          `\n  Disabling reddit updates.`,
      );
      isEnabled = false;
      isInit = true;
      return;
    }

    const userAgent =
      `discord/telegram(${ProjectManager.getEnvironment()}):` +
      `${ProjectManager.getIdentifier()}:v${ProjectManager.getVersionNumber()}` +
      ` (by /u/${userName})`;

    reddit = new Snoowrap({
      clientId,
      clientSecret,
      refreshToken,
      userAgent,
    });
    Reddit.logger.info(`Initialization successful with userAgent '${userAgent}'.`);
    isInit = true;
  }

  /** Get the reddit posts recently submitted on the given subreddit. */
  public static async getSubredditPosts(subreddit: string): Promise<RedditPost[]> {
    let posts: RedditPost[] = [];

    if (!isInit || !isEnabled) {
      return posts;
    }

    try {
      const submissions = await reddit.getSubreddit(subreddit).getNew({ limit: 50 });
      posts = submissions.map((submission) => RedditPost.fromSubmission(submission));
    } catch (error) {
      Reddit.logger.error(`Failed to get submissions on /r/${subreddit}:\n${error}`);
    }
    return posts;
  }

  /** Get the reddit posts submitted by the given user. */
  public static async getUserPosts(user: string): Promise<RedditPost[]> {
    let posts: RedditPost[] = [];

    if (!isInit || !isEnabled) {
      return posts;
    }

    try {
      const submissions = await reddit.getUser(user).getSubmissions();
      posts = submissions.map((submission) => RedditPost.fromSubmission(submission));
    } catch (error) {
      Reddit.logger.error(`Failed to get submissions by /r/${user}:\n${error}`);
    }
    return posts;
  }

  public static mdFromReddit(text: string): string {
    let fulltext = '';
    // User links
    fulltext = text.replace(/\/u\/([a-zA-Z0-9]+)/, '[/u/$1](https://reddit.com/user/$1)');
    // Subreddit links
    fulltext = text.replace(/\/r\/([a-zA-Z0-9]+)/, '[/r/$1](https://reddit.com/r/$1)');

    return text;
  }
}
