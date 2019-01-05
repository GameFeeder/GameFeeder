import { BotClient } from './bot';
import { getBotConfig } from './data';
import { TelegramBot } from './telegram';

const { prefix: telegramPrefix, token: telegramToken } = getBotConfig().telegram;
const telegramBot = new TelegramBot(telegramPrefix, telegramToken);
const bots = [ telegramBot ];

// Register commands
bots.forEach((bot) => {
  bot.registerCommand(new RegExp(`${bot.prefix}test`), (channel) => {
    bot.sendMessageToChannel(channel, 'Test!');
  });
});

// Start bots
bots.forEach((bot) => {
  bot.start();
  bot.logInfo('Starting bot.');
});
