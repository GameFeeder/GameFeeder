import Message from '../message.js';
import { UserRole } from '../user.js';
import Action from './action.js';
import CommandGroup from './command_group.js';

export default class TwoPartCommand extends CommandGroup {
  constructor(
    name: string,
    description: string,
    label: string,
    groupTrigger: RegExp,
    actionTrigger: RegExp,
    action: (message: Message, match: RegExpMatchArray) => Promise<void>,
    defaultAction: (message: Message, match: RegExpMatchArray) => Promise<void>,
    role?: UserRole,
  ) {
    super(
      name,
      description,
      // Channel label
      () => label,
      // Channel help
      (channel, prefix) => `\`${prefix}${label}\` - ${description}`,
      // Channel trigger
      () => groupTrigger,
      // Default action
      defaultAction,
      // Commands - The inner action
      [new Action(`${name}-action`, description, label, actionTrigger, action, role)],
      role,
    );
  }
}
