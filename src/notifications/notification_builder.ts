import Game from '../game.js';
import { assertIsDefined } from '../util/util.js';
import Notification from './notification.js';
import NotificationElement from './notification_element.js';

/** A representation of a bot notification. */
export default class NotificationBuilder {
  /** The game the notification is for. */
  public game?: Game;
  /** The title of the notification. */
  public title?: NotificationElement;
  /** The author of the notification. */
  public author?: NotificationElement;
  /** The color of the notification. */
  public color?: string;
  /** The content of the notification. */
  public content?: string;
  /** The (small) thumbnail of the notification. */
  public thumbnail?: string;
  /** The (big) image of the notification. */
  public image?: string;
  /** The footer of the notification. */
  public footer?: NotificationElement;

  /** Creates a new Notification builder.
   * @param timestamp - The timestamp of the notification (default: now).
   * @param version - The gameplay version of the update.
   */
  constructor(
    public timestamp: Date = new Date(),
    public version?: string,
  ) {}

  /** Changes the content of the notification.
   *
   * @param content - The new content of the notification.
   */
  public withContent(content: string): NotificationBuilder {
    this.content = content;
    return this;
  }

  /** Changes the game of the notification.
   *
   * @param game - The new game of the notification.
   */
  public withGame(game: Game): NotificationBuilder {
    this.game = game;
    return this;
  }

  /** Changes the title of the notification.
   *
   * @param titleText - The text of the title.
   * @param titleLink - The link of the title.
   * @param titleIcon - The icon of the title.
   */
  public withTitle(titleText: string, titleLink?: string, titleIcon?: string): NotificationBuilder {
    this.title = new NotificationElement(titleText, titleLink, titleIcon);
    return this;
  }

  /** Changes the image of the notification.
   *
   * @param image - The link to the new image of the notification.
   */
  public withImage(image: string): NotificationBuilder {
    this.image = image;
    return this;
  }

  /** Changes the title of the notification.
   *
   * @param authorName - The text of the author.
   * @param authorLink - The link of the author.
   * @param authorIcon - The icon of the author.
   */
  public withAuthor(
    authorName: string,
    authorLink?: string,
    authorIcon?: string,
  ): NotificationBuilder {
    this.author = new NotificationElement(authorName, authorLink, authorIcon);
    return this;
  }

  /** Changes the game of the notification and adds the default footer and color.
   *
   * @param game - The new game of the notification.
   */
  public withGameDefaults(game: Game): NotificationBuilder {
    this.game = game;
    this.color = game.color;
    this.footer = new NotificationElement(`New ${game.label} update!`, undefined, game.icon);
    return this;
  }

  /** Changes the footer of the notification.
   *
   * @param footerText - The text of the footer.
   * @param footerIcon - The icon of the footer.
   */
  public withFooter(footerText: string, footerIcon?: string): NotificationBuilder {
    this.footer = new NotificationElement(footerText, undefined, footerIcon);
    return this;
  }

  /** Changes the color of the notification.
   *
   * @param color - The new color of the notification.
   */
  public withColor(color: string): NotificationBuilder {
    this.color = color;
    return this;
  }

  /** Changes the thumbnail of the notification.
   *
   * @param thumbnail - The new thumbnail of the notification.
   */
  public withThumbnail(thumbnail: string): NotificationBuilder {
    this.thumbnail = thumbnail;
    return this;
  }

  /** Changes the timestamp of the notification.
   *
   * @param timestamp - The new timestamp of the notification.
   */
  public withTimestamp(timestamp: Date): NotificationBuilder {
    this.timestamp = timestamp;
    return this;
  }

  /** Changes the gameplay version of the notification.
   *
   * @param version - The new gameplay version of the notification.
   */
  public withVersion(version?: string): NotificationBuilder {
    this.version = version;
    return this;
  }

  /** Converts the builder to a notification. */
  public build(): Notification {
    // Check for required parameters
    assertIsDefined(this.timestamp);
    assertIsDefined(this.game);
    assertIsDefined(this.title);

    return new Notification(
      this.timestamp,
      this.game,
      this.title,
      this.content,
      this.author,
      this.color,
      this.thumbnail,
      this.image,
      this.footer,
      this.version,
    );
  }
}
