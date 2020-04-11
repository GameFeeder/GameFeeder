import EscapeRegex from 'escape-string-regexp';
import { UserRole } from '../user';
import Channel from '../channel';
import Message from '../message';
import CommandGroup from './command_group';

/**
 * Represents a command that can be executed by the users on the given bot clients.
 */
export default abstract class Command {
  /** The name of the command. */
  public name: string;
  /** The description of the command. */
  public description: string;
  /** The label of the command trigger. Used to compose the help-command. */
  public channelLabel: (channel: Channel) => string;
  /** The help string of the command. */
  public channelHelp: (channel: Channel, prefix: string, role?: UserRole) => string;
  /** Get the RegExp for the given channel. */
  public channelTrigger: (channel: Channel) => RegExp;
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
    channelLabel: (channel: Channel) => string,
    channelHelp: (channel: Channel, prefix: string, role?: UserRole) => string,
    channelTrigger: (channel: Channel) => RegExp,
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
      if (!(this instanceof CommandGroup)) {
        bot.logger.debug(
          `Command '${this.name}' executed on channel ${message.channel.label} in ${time} ms.`,
        );
      }
      return true;
    }

    bot.logger.debug(
      `Command ${this.name} on channel ${message.channel.label}: ${this.role} role required.`,
    );
    bot.sendMessage(
      message.channel,
      `You need the role '${this.role}' on this server to execute this command!`,
    );

    return false;
  }

  /** Tests if the given message triggers the command.
   *
   * @param message - The message to test.
   * @returns RegExpMatchArray, if the message matches the command trigger or undefined otherwise.
   */
  public test(message: Message): RegExpMatchArray | undefined {
    const regex = this.getRegExp(message.channel);
    const cmdMatch = regex.exec(message.content);

    if (!cmdMatch) {
      // The message does not match the command trigger
      return undefined;
    }

    return cmdMatch;
  }

  /** Gets the RegExp used to trigger the command
   *
   * @param channel - The channel to get the regex for.
   */
  public getRegExp(channel: Channel): RegExp {
    // Allow the bot tag after every command
    return new RegExp(
      `${this.channelTrigger(channel).source}(\\s*${EscapeRegex(channel.bot.getUserTag())})?\\s*`,
    );
  }
}
