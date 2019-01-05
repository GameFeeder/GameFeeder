import { BotClient } from './bot';
import { TelegramBot } from './telegram';

const telegramBot = new TelegramBot('/', '');
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
});
