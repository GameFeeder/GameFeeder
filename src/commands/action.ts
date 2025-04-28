import Command from './command.js';
import Message from '../message.js';
import { UserRole } from '../user.js';

/** An action represents a command that is executed directly. */
export default class Action extends Command {
  /** Creates a new action.
   *
   * @param name - The name and label of the action.
   * @param description - The description of the action.
   * @param trigger - The regex to trigger the action.
   * @param action - The action to execute with the action.
   * @param role - The required role to execute the action.
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
      () => label,
      // The help string is the label and the description
      (channel, prefix) => `\`${prefix}${label}\` - ${description}`,
      // The trigger is independant of the channel
      () => trigger,
      action,
      role,
    );
  }
}
