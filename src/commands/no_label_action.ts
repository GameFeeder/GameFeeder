import Message from '../message.js';
import { UserRole } from '../user.js';
import Action from './action.js';

/** An action without a seperate label. */
export default class NoLabelAction extends Action {
  /** Creates a new action without a label.
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
