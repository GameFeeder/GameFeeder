// TODO: Revisit these overrides
/* eslint-disable prefer-template */
/* eslint-disable @typescript-eslint/no-use-before-define */
import EscapeRegex from 'escape-string-regexp';
import { UserRole } from '../user';
import getBots from '../bots/bots';
import DataManager from '../managers/data_manager';
import Game from '../game';
import { filterAsync, mapAsync, naturalJoin } from '../util/util';
import ProjectManager from '../managers/project_manager';
import CommandGroup from './command_group';
import SimpleCommand from './simple_command';
import NoLabelCommand from './no_label_command';
import NoChannelCommand from './no_channel_command';

// Start
const startCmd = new SimpleCommand('start', 'Get started with the GameFeeder.', async (message) => {
  const name = ProjectManager.getName();
  const gitLink = ProjectManager.getURL();
  const version = ProjectManager.getVersionNumber();
  message.reply(
    `Welcome to the **${name}** (v${version})!\n` +
      `Use \`${await helpCmd.channelLabel(
        message.channel,
      )}\` to display all available commands.\n` +
      `View the project on [GitHub](${gitLink}) to learn more or to report an issue!`,
  );
});

// Help
const helpCmd = new SimpleCommand(
  'help',
  'Display a list of all available commands.',
  async (message) => {
    // Only show the commands the user has the role to execute.
    const filteredCommands = await filterAsync(commands, async (command) =>
      message.user.hasRole(message.channel, command.role),
    );
    const commandsList = await mapAsync(filteredCommands, async (command) => {
      return command.channelHelp(message.channel, '- ');
    });

    const helpMD = `You can use the following commands:\n${commandsList.join('\n')}`;

    message.reply(helpMD);
  },
);

// About
const aboutCmd = new NoLabelCommand(
  'about',
  'Display info about the bot.',
  /^\s*(about)|(info)\s*$/,
  async (message) => {
    const name = ProjectManager.getName();
    const gitLink = ProjectManager.getURL();
    const version = ProjectManager.getVersionNumber();
    message.reply(
      `**${name}** (v${version})\nA notification bot for several games. Learn more on [GitHub](${gitLink}).`,
    );
  },
);

// Settings
const settingsCmd = new NoLabelCommand(
  'settings',
  'Display an overview of the settings you can configure for the bot.',
  /^\s*(settings)|(options)|(config)\s*$/,
  async (message) => {
    const channel = message.channel;
    const gameStr =
      channel.gameSubs && channel.gameSubs.length > 0
        ? `> You are currently subscribed to the following games:\n` +
          `${channel.gameSubs.map((game) => `- **${game.label}**`).join('\n')}`
        : '> You are currently not subscribed to any games.';

    message.reply(
      `You can use \`${await prefixCmd.channelLabel(
        channel,
      )}\` to change the prefix the bot uses ` +
        `on this channel.\n` +
        `> The prefix currently used on this channel is \`${channel.getPrefix()}\`.\n` +
        `You can use \`${await subCmd.channelLabel(channel)}\` and ` +
        `\`${await unsubCmd.channelLabel(channel)}\` to change the games you are subscribed to.\n` +
        gameStr,
    );
  },
);

// Games
const gamesCmd = new SimpleCommand('games', 'Display all available games.', async (message) => {
  const gamesList = Game.getGames().map((game) => `- ${game.label}`);
  const gamesMD = `Available games:\n${gamesList.join('\n')}`;

  message.reply(gamesMD);
});

// Subscribe
const subCmd = new NoChannelCommand(
  'subscribe',
  `Subscribe to the given game's feed.`,
  'subscribe <game name>',
  /^\s*sub(scribe)?(?<alias>.*)\s*$/,
  async (message, match) => {
    const channel = message.channel;
    let alias: string = match.groups.alias;
    alias = alias ? alias.trim() : '';

    if (!alias) {
      message.reply(
        `You need to provide the name of the game you want to subscribe to.\n` +
          `Try \`${await subCmd.channelLabel(channel)}\`.`,
      );
    }

    const aliases = alias.split(', ');

    // The games matching the alias
    let aliasGames: Game[] = [];
    let invalidAliases: string[] = [];

    for (alias of aliases) {
      const newGames = Game.getGamesByAlias(alias);

      if (newGames.length === 0) {
        // We don't recognize that alias
        invalidAliases.push(alias);
      } else {
        aliasGames = aliasGames.concat(newGames);
      }
    }

    // Remove duplicates
    aliasGames = [...new Set(aliasGames)];
    invalidAliases = [...new Set(invalidAliases)];

    // The map of which game is a new sub
    const gameMap = await mapAsync(aliasGames, async (game) => {
      const isNew = await message.getBot().addSubscriber(channel, game);
      return { game, isNew };
    });

    const validSubs = gameMap.filter((map) => map.isNew).map((map) => map.game);
    const invalidSubs = gameMap.filter((map) => !map.isNew).map((map) => map.game);

    let msg = '';

    // Valid subscriptions
    if (validSubs.length > 0) {
      msg += `You are now subscribed to ${naturalJoin(validSubs.map((game) => game.label))}.`;
    }
    // Already subscribed
    if (invalidSubs.length > 0) {
      msg +=
        `\nYou have already subscribed to ` +
        `${naturalJoin(invalidSubs.map((game) => game.label))}.`;
    }
    // Unknown aliases
    if (invalidAliases.length > 0) {
      msg +=
        `\nWe don't know any game(s) with the alias(es) ` +
        `${naturalJoin(invalidAliases.map((gameAlias) => `'${gameAlias}'`))}.`;
    }

    message.reply(msg);
  },
  UserRole.ADMIN,
);

// Unsubscribe
const unsubCmd = new NoChannelCommand(
  'unsubscribe',
  `Unsubscribe from the given game's feed`,
  'unsubscribe <game name>',
  /^\s*unsub(scribe)?(?<alias>.*)\s*$/,
  async (message, match) => {
    const channel = message.channel;
    let { alias } = match.groups;
    alias = alias ? alias.trim() : '';

    if (!alias) {
      message.reply(
        `You need to provide the name of the game you want to unsubscribe from.\n` +
          `Try ${await unsubCmd.channelLabel(channel)}.`,
      );
    }

    const aliases = alias.split(', ');

    // The games matching the alias
    let aliasGames: Game[] = [];
    let invalidAliases: string[] = [];

    for (alias of aliases) {
      const newGames = Game.getGamesByAlias(alias);

      if (newGames.length === 0) {
        // We don't recognize that alias
        invalidAliases.push(alias);
      } else {
        aliasGames = aliasGames.concat(newGames);
      }
    }

    // Remove duplicates
    aliasGames = [...new Set(aliasGames)];
    invalidAliases = [...new Set(invalidAliases)];

    // The map of which game is a new sub
    const gameMap = aliasGames.map((game) => {
      const isNew = message.getBot().removeSubscriber(channel, game);
      return { game, isNew };
    });

    const validUnsubs = gameMap.filter((map) => map.isNew).map((map) => map.game);
    const invalidUnsubs = gameMap.filter((map) => !map.isNew).map((map) => map.game);

    let msg = '';

    // Valid unsubscriptions
    if (validUnsubs.length > 0) {
      msg += `You unsubscribed from ${naturalJoin(validUnsubs.map((game) => game.label))}.`;
    }
    // Already unsubscribed
    if (invalidUnsubs.length > 0) {
      msg +=
        `\nYou have never subscribed to ` +
        `${naturalJoin(invalidUnsubs.map((game) => game.label))} in the first place!`;
    }
    // Unknown aliases
    if (invalidAliases.length > 0) {
      msg +=
        `\nWe don't know any game(s) with the alias(es) ` +
        `${naturalJoin(invalidAliases.map((gameAlias) => `'${gameAlias}'`))}.`;
    }

    message.reply(msg);
  },
  UserRole.ADMIN,
);

// Prefix
const prefixCmd = new NoChannelCommand(
  'prefix',
  `Change the bot's prefix used in this channel.`,
  'prefix <new prefix>',
  /^\s*prefix(?<newPrefix>.*)\s*$/,
  async (message, match) => {
    const bot = message.getBot();
    const channel = message.channel;
    let { newPrefix } = match.groups;
    newPrefix = newPrefix ? newPrefix.trim() : '';

    // Check if the user has provided a new prefix
    if (!newPrefix) {
      message.reply(
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

    // Check if the bot can write to this channel
    const permissions = await bot.getUserPermissions(await bot.getUser(), channel);
    if (!permissions.canWrite) {
      if (bot.removeData(channel)) {
        bot.logger.warn(`Can't write to channel, removing all data.`);
      }
      return;
    }

    bot.sendMessage(channel, `Changing the bot's prefix on this channel to \`${newPrefix}\`.`);

    // Save locally
    channel.prefix = newPrefix;

    // Save in the JSON file
    const subscribers = DataManager.getSubscriberData();
    const channels = subscribers[bot.name];

    // Check if the channel is already registered
    const existingChannelId = channels.findIndex((ch) => channel.isEqual(ch.id));
    if (existingChannelId >= 0) {
      const existingChannel = channels[existingChannelId];
      // Update prefix
      existingChannel.prefix = newPrefix !== bot.prefix ? newPrefix : '';

      // Remove unnecessary entries
      if (existingChannel.gameSubs.length === 0 && !existingChannel.prefix) {
        bot.logger.debug('Removing unnecessary channel entry...');
        channels.splice(existingChannelId, 1);
      } else {
        channels[existingChannelId] = existingChannel;
      }
      // Save changes
      subscribers[bot.name] = channels;
      DataManager.setSubscriberData(subscribers);
    } else {
      // Add channel with the new prefix
      channels.push({
        gameSubs: [],
        id: channel.id,
        prefix: newPrefix,
      });
      // Save the changes
      subscribers[bot.name] = channels;
      DataManager.setSubscriberData(subscribers);
    }
  },
  UserRole.ADMIN,
);

// Notify All
const notifyAllCmd = new NoChannelCommand(
  'notifyAll',
  'Notify all subscribed users.',
  'notifyAll <message>',
  /^\s*(notifyAll(Subs)?)\s*(?<msg>(?:.|\s)*)\s*$/,
  async (message, match) => {
    const channel = message.channel;
    let { msg } = match.groups;
    msg = msg ? msg.trim() : '';

    // Check if the user has provided a message
    if (!msg) {
      message.reply(
        `You need to provide a message to send to everyone.\n` +
          `Try \`${await notifyAllCmd.channelLabel(channel)}\`.`,
      );
      return;
    }

    message.reply(`Notifying all subs with:\n"${msg}"`);

    // Send the provided message to all subs
    for (const curBot of getBots()) {
      curBot.sendMessageToAllSubs(msg);
    }
  },
  UserRole.OWNER,
);

// Notify Game Subs
const notifyGameSubsCmd = new NoChannelCommand(
  'notifyGameSubs',
  'Notify all subs of a game.',
  'notifyGameSubs (<game name>) <message>',
  /^\s*(notify(Game)?Subs)\s*(\((?<alias>.*)\))?\s*(?<msg>(?:.|\s)*)\s*$/,
  async (message, match) => {
    const channel = message.channel;
    let { alias, msg } = match.groups;
    alias = alias ? alias.trim() : '';
    msg = msg ? msg.trim() : '';

    // Check if the user has provided a message
    if (!msg) {
      message.reply(
        `You need to provide a message to send to everyone.\n` +
          `Try \`${await notifyGameSubsCmd.channelLabel(channel)}\`.`,
      );
      return;
    }
    // Check if the user has provided a game
    if (!alias) {
      message.reply(
        `You need to provide a game to notify the subs of.\n` +
          `Try \`${await notifyGameSubsCmd.channelLabel(channel)}\`.`,
      );
      return;
    }

    // Try to find the game
    for (const game of Game.getGames()) {
      if (game.hasAlias(alias)) {
        message.reply(`Notifying the subs of **${game.label}** with:\n"${msg}"`);
        // Notify the game's subs
        for (const curBot of getBots()) {
          curBot.sendMessageToGameSubs(game, msg);
        }

        return;
      }
    }

    // We didn't find the specified game
    message.reply(
      `I didn't find a game with the alias '${alias}'.\n` +
        `Use \`${await gamesCmd.channelLabel(channel)}\` to view a list of all available games.`,
    );
  },
  UserRole.OWNER,
);

// Flip
const flipCmd = new SimpleCommand(
  'flip',
  'Flip a coin.',
  async (message) => {
    const rnd = Math.random();

    let result;
    // Flip the coin
    if (rnd < 0.5) {
      result = 'HEADS';
    } else {
      result = 'TAILS';
    }

    // Notify the user
    message.reply(`Flipping a coin: **${result}**`);
  },
  UserRole.USER,
);

// Roll
const rollCmd = new NoChannelCommand(
  'roll',
  'Roll some dice.',
  'roll <dice count> <dice type> <modifier>',
  /^\s*r(?:oll)?\s*(?:(?<diceCountStr>\d+)\s*)?d(?<diceTypeStr>\d+)(?:\s*(?<modifierStr>(?:\+|-)\d+))?\s*$/,
  async (message, match) => {
    const { diceCountStr, diceTypeStr, modifierStr } = match.groups;

    let diceCount = diceCountStr ? parseInt(diceCountStr, 10) : 1;
    if (diceCount <= 0) {
      diceCount = 1;
    }

    // dice type represents how many sides the die has
    let diceType = diceTypeStr ? parseInt(diceTypeStr, 10) : 12;
    if (diceType <= 1) {
      diceType = 12;
    }

    const modifier = modifierStr ? parseInt(modifierStr, 10) : 0;

    let sum = 0;
    const resultStrs = [];

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < diceCount; i++) {
      // Throw a die
      const dieResult = Math.floor(Math.random() * diceType) + 1;
      // Update sum
      sum += dieResult;
      // Mark critical failure / success
      const isCrit = dieResult === 1 || dieResult === diceType;
      // Generate str
      const dieStr = isCrit ? `_${dieResult}_` : `${dieResult}`;

      resultStrs.push(dieStr);
    }

    let resultStr = diceCount === 1 ? `${sum}` : `${resultStrs.join(' + ')} = **${sum}**`;

    let text = `Rolling ${diceCount} d${diceType}`;

    // Add modifier
    if (modifier !== 0) {
      text += ` with a modifier of ${modifier}`;
      sum += modifier;
      resultStr += `${modifierStr} = **${sum}**`;
    }

    // Mark critical failure / success
    const isCriticalFailure = diceCount === 1 && sum === 1;
    const isCriticalSuccess = diceCount === 1 && sum === diceType;

    if (isCriticalFailure) {
      resultStr += ' _(critical failure)_';
    } else if (isCriticalSuccess) {
      resultStr += ' _(critical success)_';
    }

    // Notify user
    message.reply(`${text}:\n${resultStr}`);
  },
  UserRole.USER,
);

// Stats
const statsCmd = new NoLabelCommand(
  'stats',
  'Display statistics about the bot.',
  /^\s*stat(istic)?s?\s*$/,
  async (message) => {
    const botStatStrings: string[] = [];

    let totalUserCount = 0;
    let totalChannelCount = 0;

    const bots = getBots();

    // User and channel count
    for (const myBot of bots) {
      // Get statistics
      // TODO: Convert these awaits to a Promise.all()
      // eslint-disable-next-line no-await-in-loop
      const channelCount = await myBot.getChannelCount();
      // eslint-disable-next-line no-await-in-loop
      const userCount = await myBot.getUserCount();

      totalUserCount += userCount;
      totalChannelCount += channelCount;

      const userString = userCount > 1 ? 'users' : 'user';
      const channelString = channelCount > 1 ? 'servers' : 'server';
      botStatStrings.push(
        `     ${myBot.label}: ${userCount} ${userString} in ${channelCount} ${channelString}.`,
      );
    }

    const totalUserStr = totalUserCount > 1 ? 'users' : 'user';
    const totalChannelStr = totalChannelCount > 1 ? 'servers' : 'server';

    // Other stuff
    const name = ProjectManager.getName();
    const version = ProjectManager.getVersionNumber();

    const gameCount = Game.getGames().length;
    const clientCount = bots.length;
    const clients = naturalJoin(
      bots.map((_bot) => _bot.label),
      ', ',
    );

    const statString =
      `**${name}** (v${version}) statistics:\n` +
      `- **Games**: ${gameCount}\n` +
      `- **Clients**: ${clientCount} (${clients})\n` +
      `- **Users**: ${totalUserCount} ${totalUserStr} in ${totalChannelCount} ${totalChannelStr}:\n` +
      botStatStrings.join('\n');

    message.reply(statString);
  },
  UserRole.USER,
);

// Ping
const pingCmd = new SimpleCommand(
  'ping',
  'Test the delay of the bot.',
  async (message) => {
    const time = Date.now() - message.timestamp.valueOf();
    message.reply(`Pong! (${time} ms)`);
  },
  UserRole.USER,
);

// Telegram Cmds
const telegramCmdsCmd = new SimpleCommand(
  'telegramCmds',
  'Get the string to properly register the commands on Telegram.',
  async (message) => {
    const cmds = commands.filter((command) => {
      // Filter out owner commands
      return command.role !== UserRole.OWNER;
    });
    const cmdEntries = cmds.map((cmd) => {
      return `${cmd.name} - ${cmd.description}`;
    });
    // Block code format
    const telegramCmdStr = `\`\`\`\n${cmdEntries.join('\n')}\n\`\`\``;

    message.reply(telegramCmdStr);
  },
  UserRole.OWNER,
);

// Debug
const debugCmd = new SimpleCommand(
  'debug',
  'Display some useful debug information.',
  async (message) => {
    const bot = message.getBot();
    // Aggregate debug info
    const userRole = await message.user.getRole(message.channel);
    const userID = message.user.id;
    const channelID = message.channel.id;
    const serverMembers = await bot.getChannelUserCount(message.channel);
    const botTag = await bot.getUserTag();
    const time = Date.now() - message.timestamp.valueOf();

    const debugStr =
      `**User info:**\n- ID: ${userID}\n- Role: ${userRole}\n` +
      `**Channel info:**\n-ID: ${channelID}\n- Server members: ${serverMembers}\n` +
      `**Bot info:**\n- Tag: ${botTag}\n- Delay: ${time} ms`;

    message.reply(debugStr);
  },
);

// All prefixed commands
const prefixCmds: CommandGroup = new CommandGroup(
  'prefixCmds',
  'All commands that need a prefix to be executed.',
  // Label
  (channel) => {
    const prefix = EscapeRegex(channel.getPrefix());
    return prefix;
  },
  // Help
  (channel, prefix) => {
    const cmdPrefix = EscapeRegex(channel.getPrefix());
    const cmdLabels = prefixCmds.commands.map(
      async (cmd) => `${prefix}${cmd.channelHelp(channel, cmdPrefix)}`,
    );
    return cmdLabels.join('\n');
  },
  // Trigger
  (channel) => {
    const bot = channel.bot;
    const userTag = EscapeRegex(bot.getUserTag());
    const channelPrefix = EscapeRegex(channel.getPrefix());
    return new RegExp(
      `^\\s*((${userTag})|((${channelPrefix})(\\s*${userTag})?)|((${bot.prefix})\\s*(${userTag})))\\s*(?<group>.*)$`,
    );
  },
  // Action
  async (message, match) => {
    const { group } = match.groups;
    await message.channel.bot.sendMessage(
      message.channel,
      `I don't know a command named '${group}'.\nTry the \`help\` command to see a list of all commands available.`,
    );
  },
  [
    // User commands
    startCmd,
    helpCmd,
    settingsCmd,
    aboutCmd,
    gamesCmd,
    flipCmd,
    rollCmd,
    statsCmd,
    pingCmd,
    debugCmd,
    // Admin commands
    subCmd,
    unsubCmd,
    prefixCmd,
    // Owner commands
    notifyAllCmd,
    notifyGameSubsCmd,
    telegramCmdsCmd,
  ],
);

/** The standard commands available on all bots. */
const commands = [prefixCmds];

export default commands;
