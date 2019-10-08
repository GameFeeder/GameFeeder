import BotClient from './bot';
import BotChannel from './channel';
import Logger from './bot_logger';

/** Represents a user of a bot. */
export default class BotUser {
  public static logger = new Logger('Bot User');
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
  /** Get's the user's permission on the given channel.
   *
   * @param channel - The channel to get the permissions on.
   * @returns The permission the user has on the given channel.
   */
  public async getPermission(channel: BotChannel): Promise<UserPermission> {
    return await this.bot.getUserPermission(this, channel);
  }
  /** Determines whether the user has the given permission on the given channel.
   *
   * @param channel - The channel the user wants the permission on.
   * @param permission - The permission the user should have.
   *
   * @returns True, if the user has the given permission on the given channel, else false.
   */
  public async hasPermission(channel: BotChannel, permission: UserPermission): Promise<boolean> {
    switch (permission) {
      case UserPermission.OWNER:
        return (await this.getPermission(channel)) === UserPermission.OWNER;
      case UserPermission.ADMIN:
        return (await this.getPermission(channel)) !== UserPermission.USER;
      case UserPermission.USER:
        return true;
      default:
        BotUser.logger.debug('Unknown UserPermission. Denying access.');
        return false;
    }
  }
}

/** Determines the permission a user has on a channel. */
export enum UserPermission {
  /** The user is just a normal user. */
  USER = 'User',
  /** The user has admin priviliges. */
  ADMIN = 'Admin',
  /** The user is the owner of the bot. */
  OWNER = 'Owner',
}
