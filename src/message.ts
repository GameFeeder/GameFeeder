import type { BotMessage } from './bots/bot.js';
import BotClient from './bots/bot.js';
import Channel from './channel.js';
import User from './user.js';

/** A message sent to one of the bots. */
export default class Message {
  /** Creates a new message.
   *
   * @param user - The user who sent the message.
   * @param channel - The channel the message was sent on.
   * @param content - The content of the message.
   * @param timestamp - The time the message was sent at.
   */
  constructor(
    public user: User,
    public channel: Channel,
    public content: string,
    public timestamp: Date,
  ) {}

  /** Determines wheather the message does not have any content. */
  public isEmpty(): boolean {
    return !this.content?.trim();
  }

  /** Gets the bot associated to this message. */
  public getBot(): BotClient {
    return this.channel.bot;
  }

  /** Replies to this message.
   *
   * A plain string is literal text and is escaped. Use `markup/build.ts` to
   * reply with something formatted.
   *
   * @param message - The message to send.
   */
  public reply(message: BotMessage): Promise<boolean> {
    return this.getBot().sendMessage(this.channel, message);
  }
}
