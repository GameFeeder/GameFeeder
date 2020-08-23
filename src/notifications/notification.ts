import Game from '../game';
import NotificationElement from './notification_element';
import Comparable from '../util/comparable';
import { StrUtil } from '../util/util';

/** A representation of a bot notification. */
export default class Notification implements Comparable<Notification> {
  /** The timestamp of the notification. */
  public timestamp: Date;
  /** The game the notification is for. */
  public game: Game;
  /** The title of the notification. */
  public title: NotificationElement;
  /** The content of the notification. */
  public content: string;
  /** The author of the notification. */
  public author?: NotificationElement;
  /** The color of the notification. */
  public color?: string;
  /** The (small) thumbnail of the notification. */
  public thumbnail?: string;
  /** The (big) image of the notification. */
  public image?: string;
  /** The footer of the notification. */
  public footer?: NotificationElement;

  /** Creates a new Notification. */
  constructor(
    timestamp: Date,
    game: Game,
    title: NotificationElement,
    content: string,
    author?: NotificationElement,
    color?: string,
    thumbnail?: string,
    image?: string,
    footer?: NotificationElement,
  ) {
    this.timestamp = timestamp;
    this.game = game;
    this.title = title;
    this.author = author;
    this.content = content;
    this.color = color;
    this.thumbnail = thumbnail;
    this.image = image;
    this.footer = footer;
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

  public toMDString(limit?: number): string {
    const titleText = this.title.link
      ? `[**${this.title.text}**](${this.title.link})`
      : this.title.text;

    let mdStr;

    const authorText = this.author?.text
      ? this.author.link
        ? ` - [${this.author.text}](${this.author.link})`
        : ` - ${this.author.text}`
      : '';

    const contentText = this.content ? `\n\n${this.content}` : '';
    mdStr = `New **${this.game.label}** update${authorText}:\n\n${titleText}${contentText}`;

    mdStr = StrUtil.naturalLimit(mdStr, limit ?? Number.MAX_SAFE_INTEGER);

    return mdStr;
  }
}
