import Command from './command';
import BotClient from '../bots/bot';
import Channel from '../channel';
import { UserRole } from '../user';
import Message from '../message';

export default class CommandGroup extends Command {
  public regexStr: (bot: BotClient, channel: Channel) => Promise<string>;
  public defaultAction: (message: Message, match: RegExpMatchArray) => Promise<void>;
  public commands: Command[];

  constructor(
    name: string,
    description: string,
    channelLabel: (channel: Channel) => string,
    channelHelp: (channel: Channel, prefix: string, role?: UserRole) => string,
    channelTrigger: (channel: Channel) => RegExp,
    defaultAction: (message: Message, match: RegExpMatchArray) => Promise<void>,
    commands: Command[],
    role?: UserRole,
  ) {
    super(
      name,
      description,
      channelLabel,
      channelHelp,
      channelTrigger,
      async (message, match) => {
        if (!match.groups) {
          message.getBot().logger.warn(`Did not find match groups for command '${this.name}'!`);
          return;
        }

        const { group } = match.groups;

        if (!group) {
          return;
        }

        // Find matching sub-command
        const matchingCmd = this.commands.find((cmd) => {
          const regex = cmd.getRegExp(message.channel);
          // Test if the sub-command matches
          return regex.test(group);
        });

        if (matchingCmd) {
          // Match found, execute sub-command
          const regex = matchingCmd.getRegExp(message.channel);
          const cmdMatch = regex.exec(group);
          // Execute the sub-command
          await matchingCmd.execute(message, cmdMatch);
        } else {
          // No match found, execute default action
          this.defaultAction(message, match);
        }
      },
      role,
    );

    this.defaultAction = defaultAction;
    this.commands = commands;
  }

  public findCmdLabel(command: Command, channel: Channel): string {
    if (command.name === this.name) {
      return this.channelLabel(channel);
    }

    const cmdLabel = this.commands
      .map((cmd) => cmd.findCmdLabel(command, channel))
      .find((label) => label);

    if (cmdLabel) {
      return `${this.channelLabel(channel)}${cmdLabel}`;
    }

    return undefined;
  }

  public aggregateCmds(role?: UserRole): Command[] {
    const aggregates = this.commands
      .filter((cmd) => {
        switch (cmd.role) {
          case UserRole.OWNER:
            return role === UserRole.OWNER;
          case UserRole.ADMIN:
            return role === UserRole.OWNER || role === UserRole.ADMIN;
          case UserRole.USER:
            return true;
          default:
            return true;
        }
      })
      .map((cmd) => cmd.aggregateCmds());
    return [].concat(...aggregates);
  }
}
