import Command from './command';
import BotClient from '../bots/bot';
import Channel from '../channel';
import { UserRole } from '../user';
import Message from '../message';
import Action from './action';

/**
 * A command group represents a collection of commands with a common prefix.
 * E.g. all Dota 2 related commands could be collected in a Dota-CommandGroup with the common 'dota' prefix.
 */
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

  /** Tries to find the label of the given command in this group.
   *
   * @param command - The command to search for.
   * @param channel - The channel to get the label for.
   *
   * @returns The command label, or undefined, if the command could not be found.
   */
  public tryFindCmdLabel(command: Command, channel: Channel): string | undefined {
    if (command.name === this.name) {
      return this.channelLabel(channel);
    }

    const cmdLabel = this.commands
      // Map to the label, if the command is included, or else undefined
      .map((cmd) => {
        if (cmd instanceof Action) {
          if (cmd.name === command.name) {
            // Command found, return the label
            return cmd.channelLabel(channel);
          }
          // Not the command
          return undefined;
        }
        if (cmd instanceof CommandGroup) {
          // Try to find the command in the command group
          return cmd.tryFindCmdLabel(command, channel);
        }
        // Unexpected command type
        throw new Error('Unexpected command type while finding command label.');
      })
      // Try to find the label
      .find((label) => label);

    if (cmdLabel) {
      // The command is included in the group, return it together with the group label
      return `${this.channelLabel(channel)}${cmdLabel}`;
    }
    // The command is not included in the group
    return undefined;
  }

  /** Aggregate all commands included in this group and all sub-groups.
   *
   * @param role - The user role to filter the commands for.
   */
  public aggregateCmds(role?: UserRole): Action[] {
    const aggregates = this.commands
      // Filter the commands by the provided role
      .filter((cmd) => {
        switch (cmd.role) {
          case UserRole.OWNER:
            return role === UserRole.OWNER;
          case UserRole.ADMIN:
            return role === UserRole.OWNER || role === UserRole.ADMIN;
          case UserRole.USER:
            return true;
          default:
            // No role provided
            return true;
        }
      })
      .map((cmd) => {
        if (cmd instanceof Action) {
          // Wrap the command in an array
          return [cmd];
        }
        if (cmd instanceof CommandGroup) {
          // Aggregate all commands of the inner command group
          return cmd.aggregateCmds();
        }
        // Unexpected Command type
        throw new Error('Unexpected command type while aggregating commands.');
      });
    // Merge all aggregated commands to a single array
    return [].concat(...aggregates);
  }
}
