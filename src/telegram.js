const TelegramBot = require('node-telegram-bot-api');
const Data = require('./data');
const Util = require('./util');

// Get the Telegram bot token from the bot_config.json
const { token } = Data.getBotConfig().telegram;
const prefix = new RegExp(Data.getBotConfig().telegram.prefix);

// Create the bot
const bot = new TelegramBot(token, { polling: false });

function onGameSub(msg, alias) {
  const chatId = msg.chat.id;
  const userName = msg.chat.username;

  if (Util.isEmptyOrWhitespace(alias)) {
    // The user didn't provide the game to subscribe to
    bot.sendMessage(chatId, 'Use this command to subscribe to a game feed.\nUse /subscribe <GAME NAME>!');
    return;
  }

  const trimmedAlias = alias.trim();
  const gameName = Data.getGameName(trimmedAlias);

  if (!gameName) {
    // The game does not exist
    bot.sendMessage(chatId, `We don't know a game named "${trimmedAlias}"!`);
    return;
  }

  const gameTitle = Data.getGameTitle(gameName);

  if (Data.addSubscriber(chatId, 'telegram', gameName)) {
    // Confirm subscription
    console.info(`[Telegram] ${userName} subscribed to the ${gameTitle} feed.`);
    bot.sendMessage(chatId, `I will notify you about any updates for ${gameTitle}!`);
  } else {
    // User was already subscribed
    bot.sendMessage(chatId, 'You have already subscribed!');
  }
}

function onGameUnsub(msg, alias) {
  const chatId = msg.chat.id;
  const userName = msg.chat.username;

  if (Util.isEmptyOrWhitespace(alias)) {
    // The user didn't provide the game to unsubscribe from
    bot.sendMessage(chatId, 'Use this command to unsubscribe from a game feed.\nUse /unsubscribe <GAME NAME>!');
    return;
  }

  const trimmedAlias = alias.trim();
  const gameName = Data.getGameName(trimmedAlias);

  if (!gameName) {
    // The game does not exist
    bot.sendMessage(chatId, `We don't know a game named "${trimmedAlias}"!`);
    return;
  }

  const gameTitle = Data.getGameTitle(gameName);

  if (Data.removeSubscriber(chatId, 'telegram', gameName)) {
    // Confirm unsubscription
    console.info(`[Telegram] ${userName} unsubscribed from the ${gameTitle} feed.`);
    bot.sendMessage(chatId, `I will no longer notify you about any updates for ${gameTitle}!`);
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

/** Handle game subscription */
bot.onText(/^\/subscribe(?<alias>.*)$/, (msg, match) => {
  const { alias } = match.groups;
  onGameSub(msg, alias);
});

/** Handle game unsubscription */
bot.onText(/^\/unsubscribe(?<alias>.*)$/, (msg, match) => {
  const { alias } = match.groups;
  onGameUnsub(msg, alias);
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
