import { UserPermission } from './bot_user';
import getBots from './bots';
import Command from './command';
import DataManager from './data_manager';
import Game from './game';
import botLogger from './bot_logger';
import { filterAsync, mapAsync, naturalJoin } from './util';

const gitLink = `https://github.com/TimJentzsch/valveGamesAnnouncerBot`;

// Start
const startCmd = new Command(
  'Start',
  'Get started with the valveGamesAnnouncerBot.',
  'start',
  'start',
  (bot, channel, user) => {
    bot.sendMessage(
      channel,
      `Welcome to the **valveGamesAnnouncerBot**!\n` +
        `Use \`${helpCmd.getTriggerLabel(channel)}\` to display all available commands.\n` +
        `View the project on [GitHub](${gitLink}) to learn more or to report an issue!`,
    );
  },
);

// Help
const helpCmd = new Command(
  'Help',
  'Display a list of all available commands.',
  'help',
  'help\\s*$',
  async (bot, channel, user) => {
    // Only show the commands the user has permission to execute.
    const filteredCommands = await filterAsync(
      commands,
      async (command) => await user.hasPermission(channel, command.permission),
    );
    const commandsList = filteredCommands.map(
      (command) => `- \`${channel.getPrefix()}${command.triggerLabel}\`: ${command.description}`,
    );

    const helpMD = `You can use the following commands:\n${commandsList.join('\n')}`;

    bot.sendMessage(channel, helpMD);
  },
);

// About
const aboutCmd = new Command(
  'About',
  'Display info about the bot.',
  'about',
  '(about)|(info)\\s*$',
  (bot, channel) => {
    bot.sendMessage(
      channel,
      `A notification bot for Valve's games. Learn more on [GitHub](${gitLink}).`,
    );
  },
);

// Settings
const settingsCmd = new Command(
  'Settings',
  'Display an overview of the settings you can configure for the bot.',
  'settings',
  '(settings)|(options)|(config)\\s*$',
  (bot, channel) => {
    const gameStr =
      channel.gameSubs && channel.gameSubs.length > 0
        ? `> You are currently subscribed to the following games:\n` +
          `${channel.gameSubs.map((game) => `- **${game.label}**`).join('\n')}`
        : '> You are currently not subscribed to any games.';

    bot.sendMessage(
      channel,
      `You can use \`${prefixCmd.getTriggerLabel(channel)}\` to change the prefix the bot uses ` +
        `on this channel.\n` +
        `> The prefix currently used on this channel is \`${channel.getPrefix()}\`.\n` +
        `You can use \`${subCmd.getTriggerLabel(channel)}\` and ` +
        `\`${unsubCmd.getTriggerLabel(channel)}\` to change the games you are subscribed to.\n` +
        gameStr,
    );
  },
);

// Games
const gamesCmd = new Command(
  'Games',
  'Display all available games.',
  'games',
  'games\\s*$',
  (bot, channel) => {
    const gamesList = Game.getGames().map((game) => `- ${game.label}`);
    const gamesMD = `Available games:\n${gamesList.join('\n')}`;

    bot.sendMessage(channel, gamesMD);
  },
);

// Subscribe
const subCmd = new Command(
  'Subscribe',
  `Subscribe to the given game's feed.`,
  'subscribe <game name>',
  'sub(scribe)?(?<alias>.*)',
  (bot, channel, user, match: any) => {
    let { alias } = match.groups;
    alias = alias ? alias.trim() : '';

    if (!alias) {
      bot.sendMessage(
        channel,
        `You need to provide the name of the game you want to subscribe to.\n` +
          `Try \`${subCmd.getTriggerLabel(channel)}\`.`,
      );
    }

    // The games matching the alias
    const aliasGames = Game.getGamesByAlias(alias);

    if (aliasGames.length > 0) {
      // The map of which game is a new sub
      const gameMap = aliasGames.map((game) => {
        const isNew = bot.addSubscriber(channel, game);
        return { game, isNew };
      });

      const newSubs = gameMap.filter((map) => map.isNew).map((map) => map.game);
      const oldSubs = gameMap.filter((map) => !map.isNew).map((map) => map.game);

      let message = '';

      if (newSubs.length > 0) {
        message += `You are now subscribed to ${naturalJoin(newSubs.map((game) => game.label))}.`;

        if (oldSubs.length > 0) {
          message += `\nYou have already subscribed to `
            + `${naturalJoin(oldSubs.map((game) => game.label))}.`;
        }
      } else {
        message += `You have already subscribed to `
        + `${naturalJoin(oldSubs.map((game) => game.label))}.`;
      }

      bot.sendMessage(channel, message);
    }
  },
  UserPermission.ADMIN,
);

// Unsubscribe
const unsubCmd = new Command(
  'Unsubscribe',
  `Unsubscribe from the given game's feed`,
  'unsubscribe <game name>',
  'unsub(scribe)?(?<alias>.*)',
  (bot, channel, user, match: any) => {
    let { alias } = match.groups;
    alias = alias ? alias.trim() : '';

    if (!alias) {
      bot.sendMessage(
        channel,
        `You need to provide the name of the game you want to unsubscribe from.\n` +
          `Try ${unsubCmd.getTriggerLabel(channel)}.`,
      );
    }

    // The games matching the alias
    const aliasGames = Game.getGamesByAlias(alias);

    if (aliasGames.length > 0) {
      // The map of which game is a new sub
      const gameMap = aliasGames.map((game) => {
        const isNew = bot.removeSubscriber(channel, game);
        return { game, isNew };
      });

      const newUnsubs = gameMap.filter((map) => map.isNew).map((map) => map.game);
      const oldUnsubs = gameMap.filter((map) => !map.isNew).map((map) => map.game);

      let message = '';

      if (newUnsubs.length > 0) {
        message += `You unsubscribed from ${naturalJoin(newUnsubs.map((game) => game.label))}.`;

        if (oldUnsubs.length > 0) {
          message +=  `You have never subscribed to `
          + `${naturalJoin(oldUnsubs.map((game) => game.label))} in the first place!`;
        }
      } else {
        message += `You have never subscribed to `
        + `${naturalJoin(oldUnsubs.map((game) => game.label))} in the first place!`;
      }

      bot.sendMessage(channel, message);
    }
  },
  UserPermission.ADMIN,
);

// Prefix
const prefixCmd = new Command(
  'Prefix',
  `Change the bot's prefix used in this channel.`,
  'prefix',
  'prefix(?<newPrefix>.*)$',
  (bot, channel, user, match: any) => {
    let { newPrefix } = match.groups;
    newPrefix = newPrefix ? newPrefix.trim() : '';

    // Check if the user has provided a new prefix
    if (!newPrefix) {
      bot.sendMessage(
        channel,
        `The prefix currently used on this channel is \`${channel.getPrefix()}\`.\n` +
          `Use \`${channel.getPrefix()}prefix <new prefix>\` to use an other prefix.\n` +
          `Use \`${channel.getPrefix()}prefix reset\` to reset the prefix to the default` +
          `(\`${bot.prefix}\`).`,
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
    const subscribers = DataManager.getSubscriberData();
    const channels = subscribers[bot.name];

    // Check if the channel is already registered
    for (let i = 0; i < channels.length; i++) {
      const sub = channels[i];
      if (channel.isEqual(sub.id)) {
        // Update prefix
        sub.prefix = newPrefix !== bot.prefix ? newPrefix : '';

        // Remove unnecessary entries
        if (sub.gameSubs.length === 0 && !sub.prefix) {
          bot.logDebug('Removing unnecessary channel entry...');
          channels.splice(i, 1);
        } else {
          channels[i] = sub;
        }
        // Save changes
        subscribers[bot.name] = channels;
        DataManager.setSubscriberData(subscribers);
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
    DataManager.setSubscriberData(subscribers);
    return;
  },
  UserPermission.ADMIN,
);

// Notify All
const notifyAllCmd = new Command(
  'Notify All',
  'Notify all subscribed users.',
  'notifyAll <message>',
  '(notifyAll(Subs)?)\\s*(?<message>.*)',
  (bot, channel, user, match: any) => {
    let { message } = match.groups;
    message = message ? message.trim() : '';

    // Check if the user has provided a message
    if (!message) {
      bot.sendMessage(
        channel,
        `You need to provide a message to send to everyone.\n` +
          `Try \`${notifyAllCmd.getTriggerLabel(channel)}\`.`,
      );
      return;
    }

    bot.sendMessage(channel, `Notifying all subs with:\n"${message}"`);

    // Send the provided message to all subs
    for (const curBot of getBots()) {
      curBot.sendMessageToAllSubs(message);
    }
  },
  UserPermission.OWNER,
);

// Notify Game Subs
const notifyGameSubsCmd = new Command(
  'Notify Game Subs',
  'Notify all subs of a game.',
  'notifyGameSubs (<game name>) <message>',
  '(notify(Game)?Subs)\\s*(\\((?<alias>.*)\\))?\\s*(?<message>.*)\\s*$',
  (bot, channel, user, match: any) => {
    let { alias, message } = match.groups;
    alias = alias ? alias.trim() : '';
    message = message ? message.trim() : '';

    // Check if the user has provided a message
    if (!message) {
      bot.sendMessage(
        channel,
        `You need to provide a message to send to everyone.\n` +
          `Try \`${notifyGameSubsCmd.getTriggerLabel(channel)}\`.`,
      );
      return;
    }
    // Check if the user has provided a game
    if (!alias) {
      bot.sendMessage(
        channel,
        `You need to provide a game to notify the subs of.\n` +
          `Try \`${notifyGameSubsCmd.getTriggerLabel(channel)}\`.`,
      );
      return;
    }

    // Try to find the game
    for (const game of Game.getGames()) {
      if (game.hasAlias(alias)) {
        bot.sendMessage(channel, `Notifying the subs of **${game.label}** with:\n"${message}"`);
        // Notify the game's subs
        for (const curBot of getBots()) {
          curBot.sendMessageToGameSubs(game, message);
        }

        return;
      }
    }

    // We didn't find the specified game
    bot.sendMessage(
      channel,
      `I didn't find a game with the alias ${alias}.\n` +
        `Use \`${gamesCmd.getTriggerLabel(channel)}\` to view a list of all available games.`,
    );
  },
  UserPermission.OWNER,
);

// Stats
const statsCmd = new Command(
  'Stats',
  'Display statistics about the bot.',
  'stats',
  'stat(istic)?s?',
  async (bot, channel, user) => {
    const botStatStrings: string[] = [];

    let totalUserCount = 0;
    let totalChannelCount = 0;

    for (const curBot of getBots()) {
      const botChannels = curBot.getBotChannels();
      const channelCount = botChannels.length;
      const userCounts = await mapAsync(
        botChannels,
        async (botChannel) => await botChannel.getUserCount(),
      );
      const userCount = userCounts.reduce((prevValue, curValue) => prevValue + curValue);

      totalUserCount += userCount;
      totalChannelCount += channelCount;

      const userString = userCount > 1 ? 'users' : 'user';
      const channelString = channelCount > 1 ? 'channels' : 'channel';
      botStatStrings.push(
        `- **${curBot.label}**: ${userCount} ${userString} in ${channelCount} ${channelString}.`,
      );
    }

    const totalUserStr = totalUserCount > 1 ? 'users' : 'user';
    const totalChannelStr = totalChannelCount > 1 ? 'channels' : 'channel';
    const statString =
      `**Total**: ${totalUserCount} ${totalUserStr} in ${totalChannelCount} ${totalChannelStr}:\n` +
      botStatStrings.join('\n');

    bot.sendMessage(channel, statString);
  },
  UserPermission.OWNER,
);

/** The standard commands available on all bots. */
const commands = [
  // User commands
  startCmd,
  helpCmd,
  settingsCmd,
  aboutCmd,
  gamesCmd,
  // Admin commands
  subCmd,
  unsubCmd,
  prefixCmd,
  // Owner commands
  notifyAllCmd,
  notifyGameSubsCmd,
];

export default commands;
