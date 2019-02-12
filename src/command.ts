import BotClient from './bot';
import BotUser, { UserPermission } from './bot_user';
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
  public callback: (bot: BotClient, channel: BotChannel, user: BotUser, match: RegExpMatchArray) => void;
  /** Whether the command should use the bot prefix. */
  public hasPrefix: boolean;
  /** The permission required to execute the command. */
  public permission: UserPermission;

  /** Create a new command.
   *
   * @param {string} label - The label of the command.
   * @param {string} description - The description of the command.
   * @param {string} triggerLabel - The label of the command trigger. Displayed in the help-command.
   * @param {string} trigger - The RegExp string triggering the command.
   * @param {Function} callback - The callback function executing the command.
   * @param {UserPermission} permission - The permission required to execute the command.
   * @param {boolean} hasPrefix - Whether the command should use the bot prefix. Default is true.
   */
  constructor(label: string, description: string, triggerLabel: string, trigger: string,
              callback: (bot: BotClient, channel: BotChannel, user: BotUser, match: RegExpMatchArray) => void,
              permission?: UserPermission, hasPrefix?: boolean) {
    this.label = label;
    this.description = description;
    this.triggerLabel = triggerLabel;
    this.trigger = trigger;
    this.callback = callback;
    this.permission = permission != null ? permission : UserPermission.USER;
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

/** The standard commands available on all bots. */
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

      bot.sendMessage(channel, helpMD);
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
      bot.sendMessage(channel, `A notification bot for Valve's games. Learn more on [GitHub](${gitLink}).`);
    },
  ),
  // Games
  new Command(
    'Games',
    'Display all available games.',
    'games',
    'games\s*$',
    (bot, channel) => {
      const gamesList = games.map((game) => `- ${game.label}`);
      const gamesMD = `Available games:\n${gamesList.join('\n')}`;

      bot.sendMessage(channel, gamesMD);
    },
  ),
  // Subscribe
  new Command(
    'Subscribe',
    'Subscribe to the given game\'s feed.',
    'subscribe <game name>',
    'sub(scribe)?(?<alias>.*)',
    (bot, channel, user, match: any) => {

      // The user must be an admin to subscribe.
      if (bot.getUserPermission(user, channel) === UserPermission.USER) {
        bot.logDebug('Command: Subscribe: Insufficient permissions.');
        bot.sendMessage(channel, 'You need to be an admin on this server to subscribe to a feed!');
        return;
      } else {
        bot.logDebug('Command: Subscribe.');
      }

      let { alias } = match.groups;
      alias = alias.trim();

      if (!alias) {
        bot.sendMessage(channel, 'You need to provide the name of the game you want to subscribe to.\n'
        + `Try \`${bot.prefix}subscribe <game name>\`.`);
      }

      for (const game of games) {
        if (game.hasAlias(alias)) {
          if (bot.addSubscriber(channel, game)) {
            bot.sendMessage(channel,
              `You are now subscribed to the **${game.label}** feed!`);
          } else {
            bot.sendMessage(channel,
              `You have already subscribed to the **${game.label}** feed!`);
          }
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
    (bot, channel, user, match: any) => {

      // The user must be an admin to unsubscribe.
      if (bot.getUserPermission(user, channel) === UserPermission.USER) {
        bot.logDebug('Command: Unsubscribe: Insufficient permissions.');
        bot.sendMessage(channel, 'You need to be an admin on this server to unsubscribe from a feed!');
        return;
      } else {
        bot.logDebug('Command: Unsubscribe.');
      }

      let { alias } = match.groups;
      alias = alias.trim();

      if (!alias) {
        bot.sendMessage(channel, 'You need to provide the name of the game you want to unsubscribe from.\n'
        + `Try \`${bot.prefix}unsubscribe <game name>\`.`);
      }

      for (const game of games) {
        if (game.hasAlias(alias)) {
          if (bot.removeSubscriber(channel, game)) {
            bot.sendMessage(channel,
              `You are now unsubscribed from the **${game.label}** feed!`);
          } else {
            bot.sendMessage(channel,
              `You have never subscribed to the **${game.label}** feed in the first place!`);
          }
        }
      }
    },
  ),
];

export { Command, commands };
