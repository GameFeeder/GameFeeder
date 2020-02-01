import BotClient from './bots/bot';
import Channel from './channel';
import Logger from './logger';

/** Represents a user of a bot. */
export default class User {
  public static logger = new Logger('User');
  /** The bot the user is associated to. */
  public bot: BotClient;
  /** The unique ID of the user. */
  public id: string;
  /** Create a new BotUser.
   *
   * @param id - The ID of the BotUser.
   */
  constructor(bot: BotClient, id: string) {
    this.bot = bot;
    this.id = id;
  }
  /** Get's the user's role on the given channel.
   *
   * @param channel - The channel to get the role on.
   * @returns The role the user has on the given channel.
   */
  public async getRole(channel: Channel): Promise<UserRole> {
    return await this.bot.getUserRole(this, channel);
  }
  /** Determines whether the user has the given role on the given channel.
   *
   * @param channel - The channel the user wants the role on.
   * @param role - The role the user should have.
   *
   * @returns True, if the user has the given role on the given channel, else false.
   */
  public async hasRole(channel: Channel, role: UserRole): Promise<boolean> {
    switch (role) {
      case UserRole.OWNER:
        return (await this.getRole(channel)) === UserRole.OWNER;
      case UserRole.ADMIN:
        return (await this.getRole(channel)) !== UserRole.USER;
      case UserRole.USER:
        return true;
      default:
        User.logger.debug('Unknown UserRole. Denying access.');
        return false;
    }
  }
}

/** Determines the role a user has on a channel. */
export enum UserRole {
  /** The user is just a normal user. */
  USER = 'User',
  /** The user has admin priviliges. */
  ADMIN = 'Admin',
  /** The user is the owner of the bot. */
  OWNER = 'Owner',
}
