import Command from './command.js';
import { UserRole } from '../user.js';
import Channel from '../channel.js';
import Message from '../message.js';
import NoLabelAction from './no_label_action.js';

/** A very simple action. */
export default class SimpleAction extends NoLabelAction {
  /** Creates a new simple action.
   *
   * @param name - The name, label and trigger of the action.
   * @param description - The description of the action.
   * @param action - The action to execute with the action.
   * @param role - The required role to execute the action.
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
      (message) => action(message),
      role,
    );
  }
}
