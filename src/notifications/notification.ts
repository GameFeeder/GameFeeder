import Game from '../game';
import NotificationElement from './notification_element';
import Comparable from '../util/comparable';
import { StrUtil } from '../util/util';

/** A representation of a bot notification. */
export default class Notification implements Comparable<Notification> {
  /**
   * Creates a new Notification.
   * @param {Date} timestamp The timestamp of the notification.
   * @param {Game} game The game the notification is for.
   * @param {NotificationElement} title The title of the notification.
   * @param {string} [content] The content of the notification.
   * @param {NotificationElement} [author] The author of the notification.
   * @param {string} [color] The color of the notification.
   * @param {string} [thumbnail] The (small) thumbnail of the notification.
   * @param {string} [image] The (big) image of the notification.
   * @param {NotificationElement} [footer] The footer of the notification.
   * @memberof Notification
   */
  constructor(
    public timestamp: Date,
    public game: Game,
    public title: NotificationElement,
    public content?: string,
    public author?: NotificationElement,
    public color?: string,
    public thumbnail?: string,
    public image?: string,
    public footer?: NotificationElement,
  ) {}

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
