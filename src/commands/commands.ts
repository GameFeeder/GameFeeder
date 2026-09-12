import EscapeRegex from 'escape-string-regexp';
import PubSub from 'pubsub-js';
import getBots from '../bots/bots.js';
import Channel from '../channel.js';
import Game from '../game.js';
import ProjectManager from '../managers/project_manager.js';
import type { BlockNode, InlineCodeNode, InlineNode, ListItemNode } from '../markup/ast.js';
import {
  bold,
  code,
  doc,
  inlineCode,
  italic,
  link,
  list,
  listItem,
  paragraph,
  text,
} from '../markup/build.js';
import Notification from '../notifications/notification.js';
import NotificationElement from '../notifications/notification_element.js';
import Updater from '../updater.js';
import { UserRole } from '../user.js';
import { mapAsync, naturalJoin } from '../util/array_util.js';
import constants from '../util/constants.js';
import rollbar_client from '../util/rollbar_client.js';
import { matchGroups, toKebabCase } from '../util/util.js';
import Command from './command.js';
import CommandGroup from './command_group.js';
import NoLabelAction from './no_label_action.js';
import SimpleAction from './simple_action.js';
import TwoPartCommand from './two_part_command.js';

/** The label a command is invoked by in a channel, rendered as inline code.
 *
 * `tryFindCmdLabel` finds nothing for a command the channel cannot use. The
 * command's own name is a better thing to show a reader than the word
 * `undefined`, which is what the template strings this replaces used to print.
 *
 * @param command - The command to label.
 * @param channel - The channel the label is for.
 */
function cmdLabel(command: Command, channel: Channel): InlineCodeNode {
  return inlineCode(commands.tryFindCmdLabel(command, channel) ?? command.name);
}

/** Help command, used to display a list of all available commands. */
const helpCmd = new SimpleAction(
  'help',
  'Display a list of all available commands.',
  async (message) => {
    const role = await message.user.getRole(message.channel);
    const entries = Command.filterByRole(commands.commands, role).map((cmd) =>
      renderCmdHelpEntry(cmd, message.channel, message.channel.prefix),
    );

    await message.reply(doc(paragraph('You can use the following commands:'), list(...entries)));
  },
);

/** Start command, used as a welcome message. */
const startCmd = new SimpleAction('start', 'Get started with the GameFeeder.', async (message) => {
  const name = ProjectManager.getName();
  const gitLink = ProjectManager.getURL();
  const version = ProjectManager.getVersionNumber();
  await message.reply(
    doc(
      paragraph('Welcome to the ', bold(name), ` (v${version})!`),
      paragraph('Use ', cmdLabel(helpCmd, message.channel), ' to display all available commands.'),
      paragraph(
        'View the project on ',
        link(gitLink, 'GitHub'),
        ' to learn more or to report an issue!',
      ),
    ),
  );
});

/** About command, display some info about the bot. */
const aboutCmd = new NoLabelAction(
  'about',
  'Display info about the bot.',
  /^\s*(about)|(info)\s*$/,
  async (message) => {
    const name = ProjectManager.getName();
    const gitLink = ProjectManager.getURL();
    const version = ProjectManager.getVersionNumber();
    await message.reply(
      doc(
        paragraph(bold(name), ` (v${version})`),
        paragraph(
          'A notification bot for several games. Learn more on ',
          link(gitLink, 'GitHub'),
          '.',
        ),
      ),
    );
  },
);

/** Subscribe command, used to subscribe to a game. */
const subCmd = new TwoPartCommand(
  'subscribe',
  `Subscribe to the given game's feed.`,
  'subscribe <game name>',
  // Group trigger
  /^\s*sub(scribe)?(?<group>.*?)$/,
  // Action trigger
  new RegExp(
    /^\s+/.source +
      // One or multiple aliases seperated by commata, or 'all' to subscribe to all games
      `(?<alias>(?:(?:${Game.getAliases().join('|')}), )*(?:${Game.getAliases().join('|')}))` +
      /\s*$/.source,
  ),
  // Action
  async (message, match) => {
    const channel = message.channel;
    let { alias } = matchGroups(match);
    alias = alias ? alias.trim() : '';

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

    await message.reply(msg);
  },
  // Default action
  async (message) => {
    const games = Game.getGames();
    const gameList = games.map((game) => `- ${game.label}`).join('\n');

    if (message.isEmpty()) {
      await message.reply(
        `You need to specify the game you want to subscribe to. The following are available:\n${gameList}`,
      );
    } else {
      await message.reply(
        `'${message.content.trim()}' is not a valid game. The following are available:\n${gameList}`,
      );
    }
  },
  UserRole.ADMIN,
);

/** Unsubscribe command, used to unsubscribe from a game. */
const unsubCmd = new TwoPartCommand(
  'unsubscribe',
  `Unsubscribe from the given game's feed`,
  'unsubscribe <game name>',
  // Group trigger
  /^\s*unsub(scribe)?(?<group>.*?)$/,
  // Action trigger
  new RegExp(
    /^\s+/.source +
      // One or multiple aliases seperated by commata, or 'all' to unsubscribe to all games
      `(?<alias>(?:(?:${Game.getAliases().join('|')}), )*(?:${Game.getAliases().join('|')}))` +
      /\s*$/.source,
  ),
  // Action
  async (message, match) => {
    const channel = message.channel;
    let { alias } = matchGroups(match);
    alias = alias ? alias.trim() : '';

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

    await message.reply(msg);
  },
  // Default action
  async (message) => {
    const games = Game.getGames();
    const gameList = games.map((game) => `- ${game.label}`).join('\n');

    if (message.isEmpty()) {
      await message.reply(
        `You need to specify the game you want to unsubscribe from. The following are available:\n${gameList}`,
      );
    } else {
      await message.reply(
        `'${message.content.trim()}' is not a valid game. The following are available:\n${gameList}`,
      );
    }
  },
  UserRole.ADMIN,
);

/** Settings command, used to display an overview of the settings you can configure. */
const settingsCmd = new NoLabelAction(
  'settings',
  'Display an overview of the settings you can configure for the bot.',
  /^\s*(settings)|(options)|(config)\s*$/,
  async (message) => {
    const channel = message.channel;
    const blocks: BlockNode[] = [
      paragraph(
        'You can use ',
        cmdLabel(subCmd, message.channel),
        ' and ',
        cmdLabel(unsubCmd, message.channel),
        ' to change the games you are subscribed to.',
      ),
    ];

    if (channel.gameSubs && channel.gameSubs.length > 0) {
      blocks.push(paragraph('You are currently subscribed to the following games:'));
      blocks.push(
        ...[list(...channel.gameSubs.map((game) => listItem(paragraph(bold(game.label)))))],
      );
    } else {
      blocks.push(paragraph('You are currently not subscribed to any games.'));
    }

    await message.reply(doc(...blocks));
  },
);

/** Games command, used to display a list of all games. */
const gamesCmd = new SimpleAction('games', 'Display all available games.', async (message) => {
  const gamesList = Game.getGames()
    .map((game) => game.label)
    .sort((a, b) => {
      // Ignore capitalization for sorting
      return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
    });

  await message.reply(
    doc(
      paragraph('Available games:'),
      list(...gamesList.map((label) => listItem(paragraph(label)))),
    ),
  );
});

/**  Notify All command, used to manually send a notification to all subscribers. */
const notifyAllCmd = new TwoPartCommand(
  'notifyAll',
  'Notify all subscribed users.',
  'notifyAll <message>',
  // Group Trigger
  /^\s*(notifyAll(Subs)?)(?<group>(?:.|\s)*?)$/,
  // Action Trigger
  /^\s+(?<msg>.+?)\s*$/s,
  // Action
  async (message, match) => {
    let { msg } = matchGroups(match);
    msg = msg ? msg.trim() : '';

    // Check if the user has provided a message
    if (!msg) {
      await message.reply(
        doc(
          paragraph('You need to provide a message to send to everyone.'),
          paragraph('Try ', cmdLabel(notifyAllCmd, message.channel), '.'),
        ),
      );
      return;
    }

    await message.reply(doc(paragraph('Notifying all subs with:'), paragraph(`"${msg}"`)));

    // Send the provided message to all subs
    PubSub.publish(constants.EVERYONE_TOPIC, msg);
  },
  async (message) => {
    if (message.isEmpty()) {
      await message.reply(`You need to provide a message to send to the subscribers.`);
    } else {
      await message.reply(
        `'${message.content}' is an invalid message configuration. Try inserting a space between the command and the message.`,
      );
    }
  },
  UserRole.OWNER,
);

/**  Notify Game Subs command, used to manually send a notifications to the subs of a game. */
const notifyGameSubsCmd = new TwoPartCommand(
  'notifyGameSubs',
  'Notify all subs of a game.',
  'notifyGameSubs (<game name>) <message>',
  // Group trigger
  /^\s*(notify(Game)?Subs)(?<group>(?:.|\s)*?)$/,
  // Action trigger
  /^\s+\((?<alias>.*?)\)\s+(?<msg>(?:.|\s)*)\s*$/,
  // Action
  async (message, match) => {
    let { alias, msg } = matchGroups(match);
    alias = alias ? alias.trim() : '';
    msg = msg ? msg.trim() : '';

    // Check if the user has provided a message
    if (!msg) {
      await message.reply(
        doc(
          paragraph('You need to provide a message to send to everyone.'),
          paragraph('Try ', cmdLabel(notifyGameSubsCmd, message.channel), '.'),
        ),
      );
      return;
    }
    // Check if the user has provided a game
    if (!alias) {
      await message.reply(
        doc(
          paragraph('You need to provide a game to notify the subs of.'),
          paragraph('Try ', cmdLabel(notifyGameSubsCmd, message.channel), '.'),
        ),
      );
      return;
    }

    const allGames = Game.getGames();
    if (allGames.findIndex((game) => game.hasAlias(alias)) < 0) {
      // We didn't find the specified game
      await message.reply(
        `I didn't find a game with the alias '${alias}'.\n` +
          `Use \`${commands.tryFindCmdLabel(
            gamesCmd,
            message.channel,
          )}\` to view a list of all available games.`,
      );
      return;
    }

    // Publish a message for the subscribers of each game that matches
    allGames
      .filter((game) => game.hasAlias(alias))
      .forEach(async (game) => {
        await message.reply(
          doc(
            paragraph('Notifying the subs of ', bold(game.label), ' with:'),
            paragraph(`"${msg}"`),
          ),
        );
        const notification = new Notification(
          new Date(),
          game,
          new NotificationElement(''),
          // What the owner typed is literal text, not markup.
          doc(paragraph(msg)),
        );
        PubSub.publish(Updater.UPDATER_TOPIC, notification);
      });
  },
  // Default action
  async (message) => {
    if (message.isEmpty()) {
      await message.reply(
        `You need to provide the game to notify the subscribers of as well as a message to send to them.\n` +
          `Try the following format: '(<game name>) <message>'.`,
      );
    } else {
      await message.reply(
        `'${message.content}' is an invalid configuration. It must be in the form of '(<game name>) <message>'.`,
      );
    }
  },
  UserRole.OWNER,
);

/** Flip command, used to flip a coin. */
const flipCmd = new SimpleAction(
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
    await message.reply(doc(paragraph('Flipping a coin: ', bold(result))));
  },
  UserRole.USER,
);

/** Roll command, used to roll some dice. */
const rollCmd = new TwoPartCommand(
  'roll',
  'Roll some dice.',
  'roll <dice count> <dice type> <modifier>',
  // Group trigger
  /^\s*r(?:oll)?\s*(?<group>.*?)\s*$/,
  // Action trigger
  /^(?:(?<diceCountStr>\d+)\s*)?d(?<diceTypeStr>\d+)(?:\s*(?<modifierStr>(?:\+|-)\d+))?$/,
  // Action
  async (message, match) => {
    const { diceCountStr, diceTypeStr, modifierStr } = matchGroups(match);

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
    const dice: InlineNode[] = [];

    for (let i = 0; i < diceCount; i++) {
      // Throw a die
      const dieResult = Math.floor(Math.random() * diceType) + 1;
      // Update sum
      sum += dieResult;
      // Mark critical failure / success
      const isCrit = dieResult === 1 || dieResult === diceType;

      if (i > 0) {
        dice.push(text(' + '));
      }
      dice.push(isCrit ? italic(`${dieResult}`) : text(`${dieResult}`));
    }

    const result: InlineNode[] =
      diceCount === 1 ? [text(`${sum}`)] : [...dice, text(' = '), bold(`${sum}`)];

    const heading: InlineNode[] = [text(`Rolling ${diceCount} d${diceType}`)];

    // Add modifier
    if (modifier !== 0) {
      heading.push(text(` with a modifier of ${modifier}`));
      sum += modifier;
      result.push(text(`${modifierStr} = `), bold(`${sum}`));
    }

    // Mark critical failure / success
    const isCriticalFailure = diceCount === 1 && sum === 1;
    const isCriticalSuccess = diceCount === 1 && sum === diceType;

    if (isCriticalFailure) {
      result.push(text(' '), italic('(critical failure)'));
    } else if (isCriticalSuccess) {
      result.push(text(' '), italic('(critical success)'));
    }

    // Notify user
    await message.reply(doc(paragraph(...heading, text(':')), paragraph(...result)));
  },
  // Default action
  async (message) => {
    await message.reply(
      `'${message.content}' is an invalid dice configuration. Try something like '2 d20 +3'.`,
    );
  },
  UserRole.USER,
);

/** Stats command, used to display statistics about the bot. */
const statsCmd = new TwoPartCommand(
  'stats',
  'Display statistics about the bot.',
  'stats <game name (optional)>',
  // Group trigger
  /^\s*stat(istic)?s?\s*(?<group>.*?)\s*$/,
  // Action trigger
  new RegExp(
    /^\s*/.source +
      // A game alias
      `(?<alias>(?:${Game.getAliases().join('|')}))` +
      /\s*$/.source,
  ),
  async (message, match) => {
    let { alias } = matchGroups(match);
    alias = alias ? alias.trim() : '';

    const game = Game.getGamesByAlias(alias)[0];

    const botStats: ListItemNode[] = [];

    let totalUserCount = 0;
    let totalChannelCount = 0;

    const bots = getBots();

    // User and channel count
    for (const myBot of bots) {
      // Get statistics
      // TODO: Convert these awaits to a Promise.all()
      const channelCount = await myBot.getChannelCount(game);
      const userCount = await myBot.getUserCount(game);

      totalUserCount += userCount;
      totalChannelCount += channelCount;

      const userString = userCount > 1 ? 'subscribers' : 'subscriber';
      const channelString = channelCount > 1 ? 'servers' : 'server';
      botStats.push(
        listItem(
          paragraph(
            `${myBot.label}: ${userCount} ${userString} in ${channelCount} ${channelString}.`,
          ),
        ),
      );
    }

    const totalUserStr = totalUserCount > 1 ? 'subscribers' : 'subscriber';
    const totalChannelStr = totalChannelCount > 1 ? 'servers' : 'server';

    // Other stuff
    const name = ProjectManager.getName();
    const version = ProjectManager.getVersionNumber();

    await message.reply(
      doc(
        paragraph(bold(name), ` (v${version}) statistics for `, bold(game.label), ':'),
        list(
          listItem(
            paragraph(
              bold('Subscribers'),
              `: ${totalUserCount} ${totalUserStr} in ${totalChannelCount} ${totalChannelStr}:`,
            ),
            list(...botStats),
          ),
        ),
      ),
    );
  },
  async (message) => {
    if (message.isEmpty()) {
      // No game specified, display general stats
      const botStats: ListItemNode[] = [];

      let totalUserCount = 0;
      let totalChannelCount = 0;

      const bots = getBots();

      // User and channel count
      for (const myBot of bots) {
        // Get statistics
        // TODO: Convert these awaits to a Promise.all()
        const channelCount = await myBot.getChannelCount();
        const userCount = await myBot.getUserCount();

        totalUserCount += userCount;
        totalChannelCount += channelCount;

        const userString = userCount > 1 ? 'users' : 'user';
        const channelString = channelCount > 1 ? 'servers' : 'server';
        botStats.push(
          listItem(
            paragraph(
              `${myBot.label}: ${userCount} ${userString} in ${channelCount} ${channelString}.`,
            ),
          ),
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

      await message.reply(
        doc(
          paragraph(bold(name), ` (v${version}) statistics:`),
          list(
            listItem(paragraph(bold('Games'), `: ${gameCount}`)),
            listItem(paragraph(bold('Clients'), `: ${clientCount} (${clients})`)),
            listItem(
              paragraph(
                bold('Users'),
                `: ${totalUserCount} ${totalUserStr} in ${totalChannelCount} ${totalChannelStr}:`,
              ),
              list(...botStats),
            ),
          ),
        ),
      );
    } else {
      await message.reply(`'${message.content}' is an invalid game alias.`);
    }
  },
  UserRole.USER,
);

/** Ping command, used to determine the bot delay. */
const pingCmd = new SimpleAction(
  'ping',
  'Test the delay of the bot.',
  async (message) => {
    const time = Date.now() - message.timestamp.valueOf();
    await message.reply(`Pong! (${time} ms)`);
  },
  UserRole.USER,
);

/** TelegramCmds command, used to register the commands on Telegram. */
const telegramCmdsCmd = new SimpleAction(
  'telegramCmds',
  'Get the string to properly register the commands on Telegram.',
  async (message) => {
    const cmds = commands.aggregateCmds(UserRole.ADMIN);

    const cmdEntries = cmds.map((cmd) => {
      return `${cmd.name} - ${cmd.description}`;
    });

    // Block code format, so the list can be copied verbatim to BotFather.
    await message.reply(doc(code(cmdEntries.join('\n'))));
  },
  UserRole.OWNER,
);

/** Debug command, used to display debug information. */
const debugCmd = new SimpleAction(
  'debug',
  'Display some useful debug information.',
  async (message) => {
    const bot = message.getBot();
    // Aggregate debug info
    const userRole = await message.user.getRole(message.channel);
    const userID = message.user.id;
    const channelID = message.channel.id;
    const serverMembers = await bot.getChannelUserCount(message.channel);
    const botTag = bot.getUserTag();
    const time = Date.now() - message.timestamp.valueOf();

    await message.reply(
      doc(
        paragraph(bold('User info:')),
        list(listItem(paragraph(`ID: ${userID}`)), listItem(paragraph(`Role: ${userRole}`))),
        paragraph(bold('Channel info:')),
        list(
          listItem(paragraph(`ID: ${channelID}`)),
          listItem(paragraph(`Server members: ${serverMembers}`)),
        ),
        paragraph(bold('Bot info:')),
        list(listItem(paragraph(`Tag: ${botTag}`)), listItem(paragraph(`Delay: ${time} ms`))),
      ),
    );
  },
);

/** Label command, used to change the label of the given channel. */
const labelCmd = new TwoPartCommand(
  'label',
  `Change the channel's label for easier debugging.`,
  'label <bot name> <channel id> <channel label>',
  // Group trigger
  /^\s*label(?<group>.*)$/,
  // Action trigger
  /^\s*(?:(?<botName>\w+)\s+)?(?<channelID>(?:(?:\+|-)?\d+)|(?:this))\s+(?<desiredLabel>.+?)\s*$/,
  // Action
  async (message, match) => {
    const originBot = message.getBot();
    const { botName, channelID, desiredLabel } = matchGroups(match);

    let targetBot = originBot;
    let targetChannel = message.channel;

    // Get the bot to find the channel on
    if (botName) {
      const findBot = getBots().find((client) => client.name === botName);
      if (findBot) {
        targetBot = findBot;
      } else {
        // Did not find the specified bot
        const botList = getBots()
          .map((client) => `- ${client.name}`)
          .join('\n');

        await message.reply(
          `'${botName}' is not an available bot! Try one of the following:\n${botList}`,
        );
        return;
      }
    }

    if (channelID !== 'this') {
      targetChannel = targetBot.getChannelByID(channelID);
    }

    let label: string | undefined = desiredLabel.trim();

    // TODO: Maybe these logs should also be part of channel.ts, not sure though
    // Check if the user wants to reset the label
    if (label === 'reset') {
      label = undefined;
      originBot.sendMessage(
        message.channel,
        `Removing the label of channel ${targetChannel.id} on ${targetBot.name}.`,
      );
    } else {
      originBot.sendMessage(
        message.channel,
        `Changing the label of channel ${targetChannel.id} on ${targetBot.name} to '${label}'.`,
      );
    }

    const oldLabel = targetChannel.label;
    targetChannel.label = label;
    originBot.logger.debug(`Changed label of ${oldLabel} to ${targetChannel.label}`);
  },
  // Default action
  async (message) => {
    if (message.isEmpty()) {
      const hasLabel = message.channel.hasLabel();

      if (hasLabel) {
        await message.reply(
          `The label currenctly used on this channel is '${message.channel.label}'.\nYou can change the label of a channel by using '<bot name> <channel id> <channel label>'.\n` +
            `Use 'this' as channel id to change the label of this channel.`,
        );
      } else {
        await message.reply(
          `This channel does not have a label.\nYou can change the label of a channel by using '<bot name> <channel id> <channel label>'.\n` +
            `Use 'this' as channel id to change the label of this channel.`,
        );
      }
    } else {
      // Check if an ID and bot has been specified
      const channelIDMatch =
        /^\s*(?:(?<botName>\w+)\s+)?(?<channelID>(?:(?:\+|-)?\d+)|(?:this))$/.exec(message.content);
      if (channelIDMatch) {
        const channelIDGroups = matchGroups(channelIDMatch);
        const channel = message.getBot().getChannelByID(channelIDGroups.channelID);
        const botName = channelIDGroups.botName;

        let channelBot = message.getBot();

        if (botName) {
          channelBot = getBots().find((client) => client.name === botName) ?? message.getBot();
        }

        const label = channel.label;

        if (label) {
          await message.reply(
            `The label currenctly used on channel ${channel.id} is '${label}'.\nYou can change its label by using ` +
              `'${channelBot.name} ${channel.id} <channel label>' as command argument.`,
          );
        } else {
          await message.reply(
            `Channel ${channel.id} does not have a label.\nYou can change the label of it by using ` +
              `'${channelBot.name} ${channel.id} <channel label>' as command argument.`,
          );
        }
      } else {
        await message.reply(
          `'${message.content}' is an invalid configuration. Try to use '<bot name> <channel id> <channel label>'.\n` +
            `Use 'this' as channel id to change the label of this channel.`,
        );
      }
    }
  },
  UserRole.OWNER,
);

/** The syntax of a command, exactly as a user has to type it.
 *
 * Discord's slash command names are kebab-case (e.g. 'notifyGameSubs' is
 * registered as 'notify-game-subs'), unlike the camelCase internal names used
 * everywhere else (including Telegram's BotFather registration), so the leading
 * name is rewritten for Discord channels to keep the syntax actually typeable
 * there.
 *
 * @param cmd - The command to render the syntax of.
 * @param channel - The channel the syntax is for.
 * @param cmdPrefix - The command prefix to use, i.e. channel.prefix.
 */
export function renderCmdSyntax(cmd: Command, channel: Channel, cmdPrefix: string): string {
  const label = cmd.channelLabel(channel);

  if (channel.bot.name !== 'discord') {
    return `${cmdPrefix}${label}`;
  }
  return `${cmdPrefix}${label.replace(cmd.name, toKebabCase(cmd.name))}`;
}

/** Renders a single command's entry in the help list.
 *
 * The syntax is a code span rather than backticks written into the text: a
 * command is something to type, and only the tree can say so in a way that
 * every messenger then renders for itself.
 *
 * @param cmd - The command to render the entry for.
 * @param channel - The channel to render the entry for.
 * @param cmdPrefix - The command prefix to use, i.e. channel.prefix.
 */
export function renderCmdHelpEntry(
  cmd: Command,
  channel: Channel,
  cmdPrefix: string,
): ListItemNode {
  return listItem(
    paragraph(inlineCode(renderCmdSyntax(cmd, channel, cmdPrefix)), ` - ${cmd.description}`),
  );
}

/** Renders a single command's help line as plain text. */
export function renderCmdHelpLine(cmd: Command, channel: Channel, cmdPrefix: string): string {
  return `${renderCmdSyntax(cmd, channel, cmdPrefix)} - ${cmd.description}`;
}

/**
 * The group containing all available commands.
 * They share the channels prefix as prefix, e.g. '/' for Telegram.
 */
const commands: CommandGroup = new CommandGroup(
  'prefixCmds',
  'All commands that need a prefix to be executed.',
  // Label
  (channel) => {
    const prefix = channel.prefix;
    return prefix;
  },
  // Help
  (channel, prefix, role) => {
    const cmdPrefix = channel.prefix;
    const cmdLabels = Command.filterByRole(commands.commands, role || UserRole.OWNER).map(
      (cmd) => `${prefix}${renderCmdHelpLine(cmd, channel, cmdPrefix)}`,
    );
    return cmdLabels.join('\n');
  },
  // Trigger: The channels prefix, e.g. '/' for Telegram
  (channel) => {
    const bot = channel.bot;
    const userTag = EscapeRegex(bot.getUserTag());
    const channelPrefix = EscapeRegex(channel.prefix);
    return new RegExp(
      `^\\s*((${userTag})|((${channelPrefix})(\\s*${userTag})?)|((${bot.prefix})\\s*(${userTag})))\\s*(?<group>(?:.|\\s)*?)(\\s*${userTag})?\\s*$`,
    );
  },
  // Default action
  async (message, match) => {
    const { group } = matchGroups(match);
    await message.channel.bot.sendMessage(
      message.channel,
      `I don't know a command named '${group}'.\nTry the \`${commands.tryFindCmdLabel(
        helpCmd,
        message.channel,
      )}\` command to see a list of all commands available.`,
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
    // Owner commands
    notifyAllCmd,
    notifyGameSubsCmd,
    telegramCmdsCmd,
    labelCmd,
  ],
);

export default commands;
