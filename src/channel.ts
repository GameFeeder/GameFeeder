import BotClient from './bots/bot';
import Game from './game';

/** A representation of a bot's channel. */
export default class Channel {
  /** The unique ID of the channel. */
  public id: string;
  /** The label of the channel (if specified). */
  public label?: string;
  /** The BotClient this channel is used in. */
  public bot: BotClient;
  /** The games this channel is subscribed to. */
  public gameSubs: Game[];
  /** The prefix the channel uses. */
  public prefix: string;
  /** Creates a new Channel. */
  constructor(id: string, bot: BotClient, gameSubs?: Game[], prefix?: string, label?: string) {
    this.id = id;
    this.bot = bot;
    this.gameSubs = gameSubs || [];
    this.prefix = prefix;
    this.label = label;
  }
  /** Compares the channel to another channel.
   *
   * @param  {IBotChannel} other - The other channel to compare to.
   * @returns {boolean} True, if the channels are equal, else false.
   */
  public isEqual(other: Channel | string): boolean {
    if (typeof other === 'string') {
      return this.id === other;
    }
    return this.id === other.id;
  }
  public toJSON(): string {
    const labelStr = this.label ? `, "label": "${this.label}"` : '';
    const prefixStr = this.prefix ? `, "prefix": "${this.prefix}"` : '';
    return `{
      "id": "${this.id}"${labelStr},
      "gameSubs": [
        ${this.gameSubs.map((game) => game.name).join(', ')}
      ]${prefixStr}
    }`;
  }
  /** Gets the prefix used in this channel
   *
   * @return The prefix used in this channel.
   */
  public getPrefix(): string {
    if (this.prefix) {
      return this.prefix;
    }
    return this.bot.prefix;
  }

  /** Gets the number of users in this channel
   *
   * @returns The number of users in this channel
   */
  public async getUserCount(): Promise<number> {
    return this.bot.getChannelUserCount(this);
  }

  /** Returns the label and id of the channel. */
  public getLabel(): string {
    return this.label ? `${this.label} (${this.id})` : this.id;
  }
}
