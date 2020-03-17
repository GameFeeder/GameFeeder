import Message from '../message';
import { UserRole } from '../user';
import NoLabelAction from './no_label_action';

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
      async (message) => action(message),
      role,
    );
  }
}
