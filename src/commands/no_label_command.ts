import Command from './command';
import Message from '../message';
import { UserRole } from '../user';
import NonChannelCommand from './no_channel_command';

/** A command without a seperate label. */
export default class NoLabelCommand extends NonChannelCommand {
  /** Creates a new command without a label.
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
    trigger: RegExp,
    action: (message: Message, match: RegExpMatchArray) => Promise<void>,
    role?: UserRole,
  ) {
    super(
      name,
      description,
      // The name is the label
      name,
      trigger,
      action,
      role,
    );
  }
}
