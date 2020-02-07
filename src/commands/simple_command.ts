import Command from './command';
import Message from '../message';
import { UserRole } from '../user';
import NoLabelCommand from './no_label_command';

/** A very simple command. */
export default class SimpleCommand extends NoLabelCommand {
  /** Creates a new simple command.
   *
   * @param name - The name, label and trigger of the command.
   * @param description - The description of the command.
   * @param action - The action to execute with the command.
   * @param role - The required role to execute the command.
   */
  constructor(
    name: string,
    description: string,
    action: (message: Message) => Promise<void>,
    role?: UserRole,
  ) {
    super(
      name,
      description,
      // The name is the regex
      new RegExp(`^\\s*${name}\\s*$`),
      async (message, match) => action(message),
      role,
    );
  }
}
