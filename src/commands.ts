import { UserPermission } from './bot_user';
import bots from './bots';
import Command from './command';
import { getSubscribers, setSubscribers } from './data';
import games from './game';
import botLogger from './logger';
import { filterAsync } from './util';

/** The standard commands available on all bots. */
const commands = [
  // Help
  new Command(
    'Help',
    'Display a list of all available commands.',
    'help',
    'help\\s*$',
    async (bot, channel, user) => {
      // Only show the commands the user has permission to execute.
      const filteredCommands = await filterAsync(commands,
        (async (command) => await user.hasPermission(channel, command.permission)));
      const commandsList = filteredCommands
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
    UserPermission.ADMIN,
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
    UserPermission.ADMIN,
  ),
  // Prefix
  new Command(
    'Prefix',
    'Change the bot\'s prefix used in this channel.',
    'prefix',
    'prefix(?<newPrefix>.*)$',
    (bot, channel, user, match: any) => {
      let { newPrefix } = match.groups;
      newPrefix = newPrefix.trim();

      // Check if the user has provided a new prefix
      if (!newPrefix) {
        bot.sendMessage(
          channel,
          `The prefix currently used on this channel is \`${channel.getPrefix()}\`.\n`
          + `Use \`${channel.getPrefix()}prefix <new prefix>\` to use an other prefix.\n`
          + `Use \`${channel.getPrefix()}prefix reset\` to reset the prefix to the default `
          + `(\`${bot.prefix}\`).`,
        );
        return;
      }

      // Check if the user wants to reset the prefix
      if (newPrefix === 'reset') {
        newPrefix = bot.prefix;
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
    UserPermission.ADMIN,
  ),
  // Notify All
  new Command(
    'Notify All',
    'Notify all subscribed users.',
    'notifyAll <message>',
    '(notifyAll)\\s*(?<message>.*)',
    (bot, channel, user, match) => {
      let { message } = match.groups;
      message = message.trim();

      // Check if the user has provided a message
      if (!message) {
        bot.sendMessage(
          channel,
          `You need to provide a message to send to everyone.\n`
          + `Try \`${channel.getPrefix()}notifyAll <message>\`.`,
        );
        return;
      }

      bot.sendMessage(
        channel,
        `Notifying all subs with:\n"${message}"`,
      );

      // Send the provided message to all subs
      for (const curBot of bots) {
        curBot.sendMessageToAllSubs(message);
      }
    },
    UserPermission.OWNER,
  ),
  // Notify Game Subs
  new Command(
    'Notify Game Subs',
    'Notify all subs of a game.',
    'notifyGameSubs (<game name>) <message>',
    '(notify(Game)?Subs)\\s*(\\((?<alias>.*)\\))?\\s*(?<message>.*)\\s*$',
    (bot, channel, user, match) => {
      let { alias, message } = match.groups;
      alias = alias.trim();
      message = message.trim();

      // Check if the user has provided a message
      if (!message) {
        bot.sendMessage(
          channel,
          `You need to provide a message to send to everyone.\n`
          + `Try \`${channel.getPrefix()}notifyGameSubs (<game name>) <message>\`.`,
        );
        return;
      }
      // Check if the user has provided a game
      if (!alias) {
        bot.sendMessage(
          channel,
          `You need to provide a game to notify the subs of.\n`
          + `Try \`${channel.getPrefix()}notifyGameSubs (<game name>) <message>\`.`,
        );
        return;
      }

      // Try to find the game
      for (const game of games) {
        if (game.hasAlias(alias)) {
          bot.sendMessage(
            channel,
            `Notifying the subs of **${game.label}** with:\n"${message}"`,
          );
          // Notify the game's subs
          for (const curBot of bots) {
            curBot.sendMessageToGameSubs(game, message);
          }

          return;
        }
      }

      // We didn't find the specified game
      bot.sendMessage(
        channel,
        `I didn't find a game with the alias ${alias}.\n`
        + `Use \`${channel.getPrefix()}games\` to view a list of all available games.`,
      );
    },
    UserPermission.OWNER,
  ),
];

export default commands;
