import BotClient from './bot';
import BotChannel from './channel';
import { games } from './game';

export default class Command {
  /** The label of the command. */
  public label: string;
  /** The description of the command. */
  public description: string;
  /** The label of the command trigger. Displayed in the help-command. */
  public triggerLabel: string;
  /** The RegExp string triggering the command. */
  public trigger: string;
  /** The callback function executing the command. */
  public callback: (bot: BotClient, channel: BotChannel, match: RegExpMatchArray) => void;
  /** Whether the command should use the bot prefix. */
  public hasPrefix: boolean;

  /** Create a new command.
   *
   * @param {string} label - The label of the command.
   * @param {string} description - The description of the command.
   * @param {string} triggerLabel - The label of the command trigger. Displayed in the help-command.
   * @param {string} trigger - The RegExp string triggering the command.
   * @param {Function} callback - The callback function executing the command.
   * @param {boolean} hasPrefix - Whether the command should use the bot prefix. Default is true.
   */
  constructor(label: string, description: string, triggerLabel: string, trigger: string,
              callback: (bot: BotClient, channel: BotChannel, match: RegExpMatchArray) => void, hasPrefix?: boolean) {
    this.label = label;
    this.description = description;
    this.triggerLabel = triggerLabel;
    this.trigger = trigger;
    this.callback = callback;
    this.hasPrefix = hasPrefix != null ? hasPrefix : true;
  }

  /** Gets the RegExp used to trigger the command
   *
   * @param client - The BotClient to trigger the command on.
   */
  public getRegExp(client: BotClient) {
    const prefix = this.hasPrefix ? `^(${client.prefix}\s*)` : '';

    return new RegExp(prefix + this.trigger);
  }
}

const commands = [
  // Help
  new Command(
    'Help',
    'Display a list of all available commands.',
    'help',
    'help\s*$',
    (bot, channel) => {
      const commandsList = commands.map((command) => {
        return `- \`${bot.prefix}${command.triggerLabel}\`: ${command.description}`;
      });

      const commandsMD = commandsList.join('\n');
      const helpMD = `You can use the following commands:\n${commandsMD}`;

      bot.sendMessageToChannel(channel, helpMD);
    },
  ),
  // About
  new Command(
    'About',
    'Display info about the bot.',
    'about',
    '(about)|(info)\s*$',
    (bot, channel) => {
      const gitLink = `https://github.com/TimJentzsch/valveGamesAnnouncerBot`;
      bot.sendMessageToChannel(channel, `A notification bot for Valve's games. Learn more on [GitHub](${gitLink}).`);
    },
  ),
  // Subscribe
  new Command(
    'Subscribe',
    'Subscribe to the given game\'s feed.',
    'subscribe <game name>',
    'sub(scribe)?(?<alias>.*)',
    (bot, channel, match: any) => {

      bot.logDebug('Command: Subscribe.');

      let { alias } = match.groups;
      alias = alias.trim();

      for (const game of games) {
        if (game.hasAlias(alias)) {
          if (bot.addSubscriber(channel, game)) {
            bot.sendMessageToChannel(channel,
              `You are now subscribed to the **${game.label}** feed!`);
          } else {
            bot.sendMessageToChannel(channel,
              `You have already subscribed to the **${game.label}** feed!`);
          }
          break;
        }
      }
    },
  ),
  // Unsubscribe
  new Command(
    'Unsubscribe',
    'Unsubscribe from the given game\'s feed',
    'unsubscribe <game name>',
    'unsub(scribe)?(?<alias>.*)',
    (bot, channel, match: any) => {
      let { alias } = match.groups;
      alias = alias.trim();

      for (const game of games) {
        if (game.hasAlias(alias)) {
          if (bot.removeSubscriber(channel, game)) {
            bot.sendMessageToChannel(channel,
              `You are now unsubscribed from the **${game.label}** feed!`);
          } else {
            bot.sendMessageToChannel(channel,
              `You have never subscribed to the **${game.label}** feed in the first place!`);
          }
          break;
        }
      }
    },
  ),
];

export { Command, commands };
