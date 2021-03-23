import EscapeRegex from 'escape-string-regexp';
import { UserRole } from '../user';
import Channel from '../channel';
import Message from '../message';

/**
 * Represents a command that can be executed by the users on the given bot clients.
 */
export default abstract class Command {
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
    public name: string,
    public description: string,
    public channelLabel: (channel: Channel) => string,
    public channelHelp: (channel: Channel, prefix: string, role?: UserRole) => string,
    public channelTrigger: (channel: Channel) => RegExp,
    public action: (message: Message, match: RegExpMatchArray) => Promise<void>,
    public role: UserRole = UserRole.USER,
  ) {}

  public logExecutionDuration(message: Message): void {
    const bot = message.channel.bot;
    const time = Date.now() - message.timestamp.valueOf();
    bot.logger.debug(
      `Command '${this.name}' executed on channel ${message.channel.label} in ${time} ms.`,
    );
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
      this.logExecutionDuration(message);
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

  /** Filters the given command array by the provided role. */
  public static filterByRole(commands: Command[], role: UserRole): Command[] {
    return commands.filter((cmd) => {
      switch (cmd.role) {
        case UserRole.OWNER:
          // Owner commands can only be executed by owners
          return role === UserRole.OWNER;
        case UserRole.ADMIN:
          // Admin commands can only be executed by owners and admins
          return role === UserRole.OWNER || role === UserRole.ADMIN;
        case UserRole.USER:
          // User commands can be executed by anyone
          return true;
        default:
          return false;
      }
    });
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
      'i',
    );
  }
}
