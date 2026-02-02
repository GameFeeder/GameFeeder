import BotClient from './bots/bot.js';
import Channel from './channel.js';
import Notification from './notifications/notification.js';
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
   * @param message - The message to send.
   */
  public reply(message: string | Notification): Promise<boolean> {
    return this.getBot().sendMessage(this.channel, message);
  }
}
