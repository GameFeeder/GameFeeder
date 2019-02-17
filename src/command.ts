import EscapeRegex from 'escape-string-regexp';
import BotClient from './bot';
import BotUser, { UserPermission } from './bot_user';
import BotChannel from './channel';
import { getSubscribers, setSubscribers } from './data';
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
  /** Tries to execute the command on the given channel.
   *
   * @param bot - The BotClient to execute the command on.
   * @param channel - The channel to execute the command on.
   * @param user - The user trying to execute the command.
   * @param match - The RegExp match of the command trigger.
   */
  public execute(bot: BotClient, channel: BotChannel, user: BotUser, match: RegExpMatchArray): boolean {
    // Check if the user has the required permission to execute the command.
    if (user.hasPermission(channel, this.permission)) {
      bot.logDebug(`Command: ${this.label}`);
      this.callback(bot, channel, user, match);
      return true;
    } else {
      bot.logDebug(`Command: ${this.label}: Insufficient permissions.`);
      bot.sendMessage(
        channel,
        `You need the permission ${this.permission.toString()} on this server to execute this command!`,
      );
      return false;
    }
  }

  /** Gets the RegExp used to trigger the command
   *
   * @param client - The BotChannel to trigger the command on.
   */
  public async getRegExp(channel: BotChannel) {
    const bot = channel.client;
    const userTag = `\@${await bot.getUserName()}`;
    const prefix = this.hasPrefix ?
      `^\\s*((${userTag})|(${EscapeRegex(channel.getPrefix())})|((${bot.prefix})\\s*(${userTag})))\\s*` :
      '';

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
    'help\\s*$',
    (bot, channel, user) => {
      const commandsList = commands
        // Only show the commands the user has permission to execute.
        .filter((command) => user.hasPermission(channel, command.permission))
        .map((command) => `- \`${channel.getPrefix()}${command.triggerLabel}\`: ${command.description}`);

      const helpMD = `You can use the following commands:\n${commandsList.join('\n')}`;

      bot.sendMessage(channel, helpMD);
    },
  ),
  // About
  new Command(
    'About',
    'Display info about the bot.',
    'about',
    '(about)|(info)\\s*$',
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
    'games\\s*$',
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
      let { alias } = match.groups;
      alias = alias.trim();

      if (!alias) {
        bot.sendMessage(channel, 'You need to provide the name of the game you want to subscribe to.\n'
          + `Try \`${channel.getPrefix()}subscribe <game name>\`.`);
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
      let { alias } = match.groups;
      alias = alias.trim();

      if (!alias) {
        bot.sendMessage(channel, 'You need to provide the name of the game you want to unsubscribe from.\n'
          + `Try \`${channel.getPrefix()}unsubscribe <game name>\`.`);
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
  new Command(
    'Prefix',
    'Change the bot\'s prefix used in this channel.',
    'prefix',
    'prefix(?<newPrefix>.*)$',
    (bot, channel, user, match: any) => {
      let { newPrefix } = match.groups;
      newPrefix = newPrefix.trim();

      if (!newPrefix) {
        bot.sendMessage(channel, 'You need to provide a new prefix that you want to use in this channel.\n'
          + `Try \`${channel.getPrefix()}prefix <new prefix>\`.`);
        return;
      }

      bot.sendMessage(channel, `Changing the bot's prefix on this channel to \`${newPrefix}\`.`);

      // Save locally
      channel.prefix = newPrefix;

      // Save in the JSON file
      const subscribers = getSubscribers();
      const channels = subscribers[bot.name];

      // Check if the channel is already registered
      for (let i = 0; i < channels.length; i++) {
        const sub = channels[i];
        if (channel.isEqual(sub.id)) {
          // Update prefix
          sub.prefix = newPrefix !== bot.prefix ? newPrefix : '';

          // Remove unneccessary entries
          if (sub.gameSubs.length === 0 && !sub.prefix) {
            bot.logDebug('Removing unnecessary channel entry...');
            channels.splice(i, 1);
          } else {
            channels[i] = sub;
          }
          // Save changes
          subscribers[bot.name] = channels;
          setSubscribers(subscribers);
          return;
        }
      }
      // Add channel with the new prefix
      channels.push({
        gameSubs: [],
        id: channel.id,
        prefix: newPrefix,
      });
      // Save the changes
      subscribers[bot.name] = channels;
      setSubscribers(subscribers);
      return;
    },
  ),
];

export { Command, commands };
