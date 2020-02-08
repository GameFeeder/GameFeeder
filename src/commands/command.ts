import EscapeRegex from 'escape-string-regexp';
import BotClient from '../bots/bot';
import User, { UserRole } from '../user';
import Channel from '../channel';
import Message from '../message';

export default class Command {
  /** The name of the command. */
  public name: string;
  /** The description of the command. */
  public description: string;
  /** The label of the command trigger. Used to compose the help-command. */
  public channelLabel: (channel: Channel) => Promise<string>;
  /** The help string of the command. */
  public channelHelp: (channel: Channel, prefix: string) => Promise<string>;
  /** Get the RegExp for the given channel. */
  public channelTrigger: (channel: Channel) => Promise<RegExp>;
  /** The action function executing the command. */
  public action: (message: Message, match: RegExpMatchArray) => Promise<void>;
  /** The role required to execute the command. */
  public role: UserRole;

  /** Creates a new command.
   *
   * @param name - The name of the command.
   * @param description - The description of the command.
   * @param channelLabel - The label of the command trigger. Displayed in the help-command.
   * @param channelTrigger - Get the RegExp for the given channel.
   * @param action - The action function executing the command.
   * @param role - The role required to execute the command.
   */
  constructor(
    name: string,
    description: string,
    channelLabel: (channel: Channel) => Promise<string>,
    channelHelp: (channel: Channel, prefix: string) => Promise<string>,
    channelTrigger: (channel: Channel) => Promise<RegExp>,
    action: (message: Message, match: RegExpMatchArray) => Promise<void>,
    role?: UserRole,
  ) {
    this.name = name;
    this.description = description;
    this.channelLabel = channelLabel;
    this.channelHelp = channelHelp;
    this.channelTrigger = channelTrigger;
    this.action = action;
    this.role = role != null ? role : UserRole.USER;
  }
  /** Tries to execute the command on the given channel.
   *
   * @param message - The message triggering the command.
   * @param match - The RegExp match of the command trigger.
   */
  public async execute(message: Message, match: RegExpMatchArray): Promise<boolean> {
    // Check if the user has the required role to execute the command.
    const bot = message.channel.bot;

    if (await message.user.hasRole(message.channel, this.role)) {
      await this.action(message, match);
      const time = Date.now() - message.timestamp.valueOf();
      bot.logger.debug(`Command '${this.name}' executed in ${time} ms.`);
      return true;
    }

    bot.logger.debug(`Command: ${this.name}: ${this.role} role required.`);
    bot.sendMessage(
      message.channel,
      `You need the role '${this.role}' on this server to execute this command!`,
    );

    return false;
  }

  /** Gets the RegExp used to trigger the command
   *
   * @param channel - The channel to get the regex for.
   */
  public async getRegExp(channel: Channel) {
    const regexString = await this.channelTrigger(channel);

    return new RegExp(regexString);
  }
}
