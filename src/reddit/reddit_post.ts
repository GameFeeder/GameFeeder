import Snoowrap from 'snoowrap';
import Notification from '../notifications/notification';
import Reddit from './reddit';
import Game from '../game';

/** A post made on reddit. */
export default class RedditPost {
  /** The title of the post. */
  public title: string;
  /** The URL of the post. */
  public url: string;
  /** The content of the post. */
  public content: string;
  /** The name of the subreddit the post was submitted in. */
  public subreddit: string;
  /** The name of the user that submitted the post. */
  public user: string;
  /** The time the post was created at. */
  public timestamp: Date;

  /**
   *
   * @param title - The title of the post.
   * @param url - The URL of the post.
   * @param content - The content of the post.
   * @param subreddit - The name of the subreddit the post was submitted in.
   * @param user - The name of the user that submitted the post.
   * @param timestamp - The time the post was created at.
   */
  constructor(
    title: string,
    url: string,
    content: string,
    subreddit: string,
    user: string,
    timestamp: Date,
  ) {
    this.title = title;
    this.url = url;
    this.content = content;
    this.subreddit = subreddit;
    this.user = user;
    this.timestamp = timestamp;
  }

  /** Create a reddit post from a Snoowrap reddit submission.
   *
   * @param submission - The submission to create the post from.
   */
  public static fromSubmission(submission: Snoowrap.Submission): RedditPost {
    const title = submission.title;
    const url = submission.url;
    const content = Reddit.mdFromReddit(submission.selftext);
    // Remove subreddit prefix
    const subreddit = submission.subreddit_name_prefixed.substr(2);
    const user = submission.author.name;
    const timestamp = new Date(submission.created_utc * 1000);

    return new RedditPost(title, url, content, subreddit, user, timestamp);
  }

  /** COnvert the reddit post to a game notification.
   *
   * @param game - The game the notification is about.
   */
  public toGameNotification(game: Game): Notification {
    const crosspostRegex = /^\/r\/.*/;
    // Crossposts have a relative url, e.g. '/r/DotA2/comments/...'
    const url = crosspostRegex.test(this.url) ? `https://www.reddit.com${this.url}` : this.url;
    return new Notification(this.timestamp)
      .withTitle(this.title, url)
      .withContent(this.content)
      .withAuthor(
        `/u/${this.user}`,
        `https://www.reddit.com/user/${this.user}`,
        'https://www.redditstatic.com/new-icon.png',
      )
      .withGameDefaults(game);
  }

  /** Determines if the post is 'valid' and should be send to the users. */
  public isValid(date: Date, titleFilter: RegExp, urlFilters: string[]): boolean {
    return (
      this.isNew(date) &&
      this.hasValidTitle(titleFilter) &&
      this.isNewSource(urlFilters) &&
      !this.isDeleted()
    );
  }

  /** Checks if the url is already covered by other providers. */
  public isNewSource(urlFilters: string[]): boolean {
    let isNewSource = true;
    for (const filter of urlFilters) {
      const alreadyCovered = new RegExp(filter).test(this.url);
      if (alreadyCovered) {
        isNewSource = false;
      }
    }
    return isNewSource;
  }

  /** Checks the title to determine if the post is an update. */
  public hasValidTitle(titleFilter: RegExp): boolean {
    return titleFilter.test(this.title);
  }

  /** Checks if the submission is new. */
  public isNew(date: Date): boolean {
    return this.timestamp > date;
  }

  /** Checks if the subreddit is correct. */
  public isCorrectSub(subreddit: string): boolean {
    return this.subreddit === subreddit;
  }

  /** Checks if the post has been deleted. */
  public isDeleted(): boolean {
    return /^\[removed\]$/.test(this.content);
  }
}
