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
  public link: string;
  /** The author of the notification. */
  public author: string;
  /** The icon of the author of the notification */
  public authorIcon: string;
  /** The color of the notification. */
  public color: string;
  /** The description of the notification. */
  public description: string;
  /** The (small) thumbnail of the notification. */
  public thumbnail: string;
  /** The (big) image of the notification. */
  public image: string;
  /** The timestamp of the notification. */
  public timestamp: Date;
  /** The footer of the notification. */
  public footer: string;
  /** The icon of the footer of the notification. */
  public footerIcon: string;

  /** Creates a new BotNotification.
   * @param  {string} text - Simple text in the notification.
   * @param  {Game} game - The game the notification is for.
   * @param  {string} title - The title of the notification.
   * @param  {string} link - The link to the source of the notification.
   * @param  {string} author - The author of the notification.
   * @param  {string} color - The color of the notification.
   * @param  {string} description - The description of the notification.
   * @param  {string} thumbnail - he (small) thumbnail of the notification.
   * @param  {string} image - The (big) image of the notification.
   * @param  {Date} timestamp - The timestamp of the notification.
   * @param  {string} footer - The footer of the notification.
   */
  constructor(
    game: Game,
    text: string,
    title: string,
    link: string,
    description: string,
    timestamp: Date,
    thumbnail: string,
    image: string,
    author: string,
    authorIcon: string,
    footer?: string,
    footerIcon?: string,
    color?: string,
  ) {
    this.game = game;
    this.text = text;
    this.title = title;
    this.link = link;
    this.description = description;
    this.timestamp = timestamp;
    this.thumbnail = thumbnail;
    this.image = image;
    this.author = author;
    this.authorIcon = authorIcon;
    this.footer = footer ? footer : (game ? `New ${game.label} update!` : '');
    this.footerIcon = footerIcon ? footerIcon : (game ? game.icon : '');
    this.color = color ? color : (game ? game.color : '');
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
