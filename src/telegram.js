const TelegramBot = require('node-telegram-bot-api');
const Data = require('./data');

// Get the Telegram bot token from the bot_config.json
const { token } = Data.getBotConfig().telegram;

// Create the bot
const bot = new TelegramBot(token, { polling: false });

function onDotaSub(msg) {
  const chatId = msg.chat.id;
  const userName = msg.chat.username;

  if (Data.addSubscriber(chatId, 'telegram', 'dota')) {
    // Confirm subscription
    console.info(`[Telegram] ${userName} subscribed to the Dota feed.`);
    bot.sendMessage(chatId, 'I will notify you in case of updates!');
  } else {
    // User was already subscribed
    bot.sendMessage(chatId, 'You have already subscribed!');
  }
}

function onDotaUnsub(msg) {
  const chatId = msg.chat.id;
  const userName = msg.chat.username;

  if (Data.removeSubscriber(chatId, 'telegram', 'dota')) {
    // Confirm unsubscription
    console.info(`[Telegram] ${userName} unsubscribed from the Dota feed.`);
    bot.sendMessage(chatId, 'I will no longer notify you about any updates!');
  } else {
    // User wasn't subscribed
    bot.sendMessage(chatId, 'You have never subscribed in the first place!');
  }
}

/*
 * ------------------
 * COMMANDS
 * ------------------
 */

/** Handle Dota subscription */
bot.onText(/\/subscribe dota/, (msg) => {
  onDotaSub(msg);
});

/** Handle Dota unsubscription */
bot.onText(/\/unsubscribe dota/, (msg) => {
  onDotaUnsub(msg);
});

async function start() {
  if (token) {
    console.info('[Telegram] Starting bot.');
    bot.startPolling({ restart: true });
  } else {
    console.warn('[Telegram] Token not provided, start ommited. Set the token in "bot_config.json".');
  }
}

module.exports = {
  start,
};
