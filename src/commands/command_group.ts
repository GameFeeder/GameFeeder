import Command from './command.js';
import Channel from '../channel.js';
import { UserRole } from '../user.js';
import Message from '../message.js';
import Action from './action.js';
import { mergeArrays } from '../util/array_util.js';

/**
 * A command group represents a collection of commands with a common prefix.
 * E.g. all Dota 2 related commands could be collected in a Dota-CommandGroup with the common 'dota' prefix.
 */
export default class CommandGroup extends Command {
  constructor(
    name: string,
    description: string,
    channelLabel: (channel: Channel) => string,
    channelHelp: (channel: Channel, prefix: string, role?: UserRole) => string,
    channelTrigger: (channel: Channel) => RegExp,
    public defaultAction: (message: Message, match: RegExpMatchArray) => Promise<void>,
    public commands: Command[],
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
          this.defaultAction(
            new Message(message.user, message.channel, '', message.timestamp),
            match,
          );
          return;
        }

        // The message, but with the content that remains for the sub-commands
        const newMessage = new Message(message.user, message.channel, group, message.timestamp);

        // Find matching sub-command
        const matchingCmd = this.commands.find((cmd) => {
          // Test if the sub-command matches
          return cmd.test(newMessage);
        });

        if (matchingCmd) {
          // Match found, execute sub-command
          // TODO: Reuse the match from the previous test
          const cmdMatch = matchingCmd.test(newMessage);
          if (!cmdMatch) {
            // This should never happen, as the command already matched the message
            throw new Error('Unreachable state');
          }
          // Execute the sub-command
          await matchingCmd.execute(newMessage, cmdMatch);
        } else {
          // No match found, execute default action
          this.defaultAction(newMessage, match);
        }
      },
      role,
    );
  }

  /** Override log method for command groups to avoid duplicate logs */
  public logExecutionDuration(): void {
    // Don't log anything for command groups
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
    const aggregates = Command.filterByRole(this.commands, role || UserRole.OWNER).map((cmd) => {
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
    return mergeArrays(aggregates);
  }
}
