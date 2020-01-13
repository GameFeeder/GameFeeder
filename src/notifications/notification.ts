import Game from '../game';
import NotificationElement from './notification_element';
import Comparable from '../util/comparable';

/** A representation of a bot notification. */
export default class Notification implements Comparable<Notification> {
  /** Simple text in the notification. */
  public text: string;
  /** The game the notification is for. */
  public game: Game;
  /** The title of the notification. */
  public title: NotificationElement;
  /** The author of the notification. */
  public author: NotificationElement;
  /** The color of the notification. */
  public color?: string;
  /** The description of the notification. */
  public description: string;
  /** The (small) thumbnail of the notification. */
  public thumbnail: string;
  /** The (big) image of the notification. */
  public image: string;
  /** The timestamp of the notification. */
  public timestamp: Date;
  /** The footer of the notification. */
  public footer?: NotificationElement;

  /** Creates a new Notification.
   * @param timestamp - The timestamp of the notification (default: now).
   */
  constructor(timestamp?: Date) {
    this.timestamp = timestamp ? timestamp : new Date();
  }

  /** Changes the text of the notification.
   *
   * @param text - The new text of the notification.
   */
  public withText(text: string): Notification {
    this.text = text;
    return this;
  }

  /** Changes the game of the notification.
   *
   * @param game - The new game of the notification.
   */
  public withGame(game: Game): Notification {
    this.game = game;
    return this;
  }

  /** Changes the title of the notification.
   *
   * @param titleText - The text of the title.
   * @param titleLink - The link of the title.
   * @param titleIcon - The icon of the title.
   */
  public withTitle(titleText: string, titleLink?: string, titleIcon?: string): Notification {
    this.title = new NotificationElement(titleText, titleLink, titleIcon);
    return this;
  }

  /** Changes the image of the notification.
   *
   * @param image - The link to the new image of the notification.
   */
  public withImage(image: string): Notification {
    this.image = image;
    return this;
  }

  /** Changes the title of the notification.
   *
   * @param authorName - The text of the author.
   * @param authorLink - The link of the author.
   * @param authorIcon - The icon of the author.
   */
  public withAuthor(authorName: string, authorLink?: string, authorIcon?: string): Notification {
    this.author = new NotificationElement(authorName, authorLink, authorIcon);
    return this;
  }

  /** Changes the footer of the notification.
   *
   * @param footerText - The text of the footer.
   * @param footerIcon - The icon of the footer.
   */
  public withFooter(footerText: string, footerIcon?: string): Notification {
    this.footer = new NotificationElement(footerText, null, footerIcon);
    return this;
  }

  /** Changes the color of the notification.
   *
   * @param color - The new color of the notification.
   */
  public withColor(color: string): Notification {
    this.color = color;
    return this;
  }

  /** Changes the thumbnail of the notification.
   *
   * @param thumbnail - The new thumbnail of the notification.
   */
  public withThumbnail(thumbnail: string): Notification {
    this.thumbnail = thumbnail;
    return this;
  }

  /** Changes the timestamp of the notification.
   *
   * @param timestamp - The new timestamp of the notification.
   */
  public withTimestamp(timestamp: Date) {
    this.timestamp = timestamp;
    return this;
  }

  public compareTo(other: Notification): -1 | 0 | 1 {
    if (this.timestamp < other.timestamp) {
      return -1;
    }
    if (this.timestamp > other.timestamp) {
      return 1;
    }
    return 0;
  }

  public toMDString(): string {
    const titleText = this.title.link
      ? `[**${this.title.text}**](${this.title.link})`
      : this.title.text;

    if (this.author.text) {
      const authorText = this.author.link
        ? `[${this.author.text}](${this.author.link})`
        : this.author.text;

      return `New **${this.game.label}** update - ${authorText}:\n\n${titleText}\n\n${this.description}`;
    }

    return `New **${this.game.label}** update:\n\n${titleText}\n\n${this.description}`;
  }
}
