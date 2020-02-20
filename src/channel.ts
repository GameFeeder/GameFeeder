import BotClient from './bots/bot';
import Game from './game';

/** A representation of a bot's channel. */
export default class Channel {
  /** The unique ID of the channel. */
  public id: string;
  /** The BotClient this channel is used in. */
  public bot: BotClient;
  /** The games this channel is subscribed to. */
  public gameSubs: Game[];
  /** The prefix the channel uses. */
  public prefix: string;
  /** Creates a new Channel. */
  constructor(id: string, client: BotClient, gameSubs?: Game[], prefix?: string) {
    this.id = id;
    this.bot = client;
    this.gameSubs = gameSubs || [];
    this.prefix = prefix != null ? prefix : '';
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
    return `{
      "id": "${this.id}",
      "gameSubs": [
        ${this.gameSubs.map((game) => game.name).join(', ')}
      ],
      "prefix": "${this.prefix}"
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
}
