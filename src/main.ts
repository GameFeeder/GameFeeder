import { BotClient } from './bot';
import { getBotConfig, getDataConfig } from './data';
import { DiscordBot } from './discord_bot';
import { Game } from './game';
import { TelegramBot } from './telegram_bot';

// Games
const games: Game[] = [];
getDataConfig().games.forEach((game: any) => {
  games.push(new Game(game.name, game.aliases, game.label));
});

// Telegram Bot
const { prefix: telegramPrefix, token: telegramToken } = getBotConfig().telegram;
const telegramBot = new TelegramBot(telegramPrefix, telegramToken);

// Discord Bot
const { prefix: discordPrefix, token: discordToken } = getBotConfig().discord;
const discordBot = new DiscordBot(discordPrefix, discordToken);

// All bots
const bots = [ telegramBot , discordBot ];

// Register commands
bots.forEach((bot) => {
  bot.registerCommand(new RegExp(`${bot.prefix}test`), (channel) => {
    bot.logDebug('Command: Test.');
    bot.sendMessageToChannel(channel, 'Test!');
  });

  bot.registerCommand(new RegExp(`${bot.prefix}subscribe(?<alias>.*)`), (channel, match: any) => {
    bot.logDebug('Command: Subscribe.');

    let { alias } = match.groups;
    alias = alias.trim();

    for (const game of games) {
      if (game.hasAlias(alias)) {
        if (bot.addSubscriber(channel, game)) {
          bot.sendMessageToChannel(channel, `You are now subscribed to the ${game.name} feed!`);
        } else {
          bot.sendMessageToChannel(channel, `You have already subscribed to the ${game.name} feed!`);
        }
        break;
      }
    }
  });

  bot.registerCommand(new RegExp(`${bot.prefix}unsubscribe(?<alias>.*)`), (channel, match: any) => {
    bot.logDebug('Command: Unsubscribe.');

    let { alias } = match.groups;
    alias = alias.trim();

    for (const game of games) {
      if (game.hasAlias(alias)) {
        if (bot.removeSubscriber(channel, game)) {
          bot.sendMessageToChannel(channel, `You are now unsubscribed from the ${game.name} feed!`);
        } else {
          bot.sendMessageToChannel(channel, `You have never subscribed to the ${game.name} feed in the first place!`);
        }
        break;
      }
    }
  });
});

// Start bots
bots.forEach((bot) => {
  if (bot.start()) {
    bot.logInfo('Started bot.');
  } else {
    bot.logWarn('Bot did not start. Did you provide a token in "bot_config.json"?');
  }
});
