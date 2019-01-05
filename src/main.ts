import { BotClient } from './bot';
import { getBotConfig } from './data';
import { DiscordBot } from './discord_bot';
import { TelegramBot } from './telegram_bot';

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
    bot.logDebug('Test command...');
    bot.sendMessageToChannel(channel, 'Test!');
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
