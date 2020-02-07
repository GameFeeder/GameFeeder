import User from './user';
import Channel from './channel';
import BotClient from './bots/bot';
import Notification from './notifications/notification';

/** A message sent to one of the bots. */
export default class Message {
  /** The user who sent the message. */
  public user: User;
  /** The channel the message was sent on. */
  public channel: Channel;
  /** The content of the message. */
  public content: string;
  /** The time the message was sent at. */
  public timestamp: Date;

  /** Creates a new message.
   *
   * @param user - The user who sent the message.
   * @param channel - The channel the message was sent on.
   * @param content - The content of the message.
   * @param timestamp - The time the message was sent at.
   */
  constructor(user: User, channel: Channel, content: string, timestamp: Date) {
    this.user = user;
    this.channel = channel;
    this.content = content;
    this.timestamp = timestamp;
  }

  /** Gets the bot associated to this message. */
  public getBot(): BotClient {
    return this.channel.bot;
  }

  /** Replies to this message.
   *
   * @param message - The message to send.
   */
  public async reply(message: string | Notification): Promise<boolean> {
    return this.getBot().sendMessage(this.channel, message);
  }
}
