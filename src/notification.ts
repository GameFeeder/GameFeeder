import { Game } from './game';
import NotificationElement from './notification_element';

/** A representation of a bot notification. */
export default class BotNotification {

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

  /** Creates a new BotNotification.
   * @param  {string} text - Simple text in the notification.
   * @param  {Game} game - The game the notification is for.
   * @param  {NotificationElement} title - The title of the notification.
   * @param  {NotificationElement} author - The author of the notification.
   * @param  {string} color - The color of the notification.
   * @param  {string} description - The description of the notification.
   * @param  {string} thumbnail - he (small) thumbnail of the notification.
   * @param  {string} image - The (big) image of the notification.
   * @param  {Date} timestamp - The timestamp of the notification.
   * @param  {NotificationElement} footer - The footer of the notification.
   */
  constructor(
    game: Game,
    text: string,
    title: NotificationElement,
    description: string,
    timestamp: Date,
    thumbnail: string,
    image: string,
    author: NotificationElement,
    footer?: NotificationElement,
    color?: string,
  ) {
    this.game = game;
    this.text = text;
    this.title = title;
    this.description = description;
    this.timestamp = timestamp;
    this.thumbnail = thumbnail;
    this.image = image;
    this.author = author;
    this.footer =
      footer ? footer : (game ? new NotificationElement(`New ${game.label} update!`, null, game.icon) : null);
    this.color = color ? color : (game ? game.color : '');
  }

  public compare(b: BotNotification) {
    return this.timestamp.valueOf() - b.timestamp.valueOf();
  }

  public toMDString(): string {
    const authorText = this.author.link ? `[${this.author.text}](${this.author.link})` : this.author.text;
    const titleText = this.title.link ? `[**${this.title.text}**](${this.title.link})` : this.title.text;

    return `New **${this.game.label}** update by ${authorText}:\n\n${titleText}\n\n${this.description}`;
  }
}
