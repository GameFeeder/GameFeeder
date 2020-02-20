import Command from './command';
import BotClient from '../bots/bot';
import Channel from '../channel';
import { UserRole } from '../user';
import Message from '../message';

export default class CommandGroup extends Command {
  public regexStr: (bot: BotClient, channel: Channel) => Promise<string>;
  public defaultAction: (message: Message, match: RegExpMatchArray) => Promise<void>;
  public commands: Command[];

  constructor(
    name: string,
    description: string,
    channelLabel: (channel: Channel) => Promise<string>,
    channelHelp: (channel: Channel, prefix: string) => Promise<string>,
    channelTrigger: (channel: Channel) => Promise<RegExp>,
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
        const matchingCmd = this.commands.find(async (cmd) => {
          const regex = await cmd.getRegExp(message.channel);
          // Test if the sub-command matches
          return regex.test(group);
        });

        if (matchingCmd) {
          // Match found, execute sub-command
          const regex = await matchingCmd.getRegExp(message.channel);
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
}