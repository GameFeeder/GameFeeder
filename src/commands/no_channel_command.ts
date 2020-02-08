import Command from './command';
import Message from '../message';
import { UserRole } from '../user';

/** A command independant from the channel it's used on. */
export default class NoChannelCommand extends Command {
  /** Creates a new no-channel command.
   *
   * @param name - The name and label of the command.
   * @param description - The description of the command.
   * @param trigger - The regex to trigger the command.
   * @param action - The action to execute with the command.
   * @param role - The required role to execute the command.
   */
  constructor(
    name: string,
    description: string,
    label: string,
    trigger: RegExp,
    action: (message: Message, match: RegExpMatchArray) => Promise<void>,
    role?: UserRole,
  ) {
    super(
      name,
      description,
      // The label is independant of the channel
      async (channel) => label,
      // The help string is the label and the description
      async (channel, prefix) => `\`${prefix}${label}\` - ${description}`,
      // The trigger is independant of the channel
      async (channel) => trigger,
      action,
      role,
    );
  }
}
