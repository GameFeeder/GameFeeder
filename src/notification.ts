import { URL } from 'url';
import { Game } from './game';

/** A representation of a bot notification. */
export default class BotNotification {
  /** Simple text in the notification. */
  public text: string;
  /** The game the notification is for. */
  public game: Game;

  /** The title of the notification. */
  public title: string;
  /** The link to the source of the notification. */
  public link: URL;
  /** The author of the notification. */
  public author: string;
  /** The color of the notification. */
  public color: string;
  /** The description of the notification. */
  public description: string;
  /** The (small) thumbnail of the notification. */
  public thumbnail: URL;
  /** The (big) image of the notification. */
  public image: URL;
  /** The timestamp of the notification. */
  public timestamp: Date;
  /** The footer of the notification. */
  public footer: string;

  /** Creates a new BotNotification.
   * @param  {string} text - Simple text in the notification.
   * @param  {Game} game - The game the notification is for.
   * @param  {string} title - The title of the notification.
   * @param  {URL} link - The link to the source of the notification.
   * @param  {string} author - The author of the notification.
   * @param  {string} color - The color of the notification.
   * @param  {string} description - The description of the notification.
   * @param  {URL} thumbnail - he (small) thumbnail of the notification.
   * @param  {URL} image - The (big) image of the notification.
   * @param  {Date} timestamp - The timestamp of the notification.
   * @param  {string} footer - The footer of the notification.
   */
  constructor(
    text: string,
    game: Game,
    title: string,
    link: URL,
    author: string,
    color: string,
    description: string,
    thumbnail: URL,
    image: URL,
    timestamp: Date,
    footer: string,
  ) {
    this.text = text;
    this.game = game;
    this.title = title;
    this.link = link;
    this.author = author;
    this.color = color;
    this.description = description;
    this.thumbnail = thumbnail;
    this.image = image;
    this.timestamp = timestamp;
    this.footer = footer;
  }

  public compare(b: BotNotification) {
    if (this.timestamp < b.timestamp) {
      return -1;
    } else if (this.timestamp > b.timestamp) {
      return 1;
    } else {
      return 0;
    }
  }
}
