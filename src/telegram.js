const TelegramBot = require('node-telegram-bot-api');
const Data = require('./data');
const Util = require('./util');

// Get the Telegram bot token from the bot_config.json
const { token } = Data.getBotConfig().telegram;
const { prefix } = Data.getBotConfig().telegram;
const regPrefix = Util.escapeRegExp(prefix);

// Create the bot
const bot = new TelegramBot(token, { polling: false });

/** @description Handle game subscriptions.
 *
 * @param  {Object} msg - The Telegram msg object that triggered the event.
 * @param  {string} alias - The alias of the game to subscribe to.
 */
function onGameSub(msg, alias) {
  const chatId = msg.chat.id;
  const userName = msg.chat.username;

  if (Util.isEmptyOrWhitespace(alias)) {
    // The user didn't provide the game to subscribe to
    bot.sendMessage(chatId, `Use this command to subscribe to a game feed.\nTry \`${prefix}subscribe <GAME NAME>\`!`, { parse_mode: 'Markdown' });
    return;
  }

  const gameName = Data.getGameName(alias);

  if (!gameName) {
    // The game does not exist
    bot.sendMessage(chatId, `We don't know a game named "${alias.trim()}"!`);
    return;
  }

  const gameTitle = Data.getGameTitle(gameName);

  if (Data.addSubscriber(chatId, 'telegram', gameName)) {
    // Confirm subscription
    console.info(`[Telegram] ${userName} subscribed to the ${gameTitle} feed.`);
    bot.sendMessage(chatId, `I will notify you about any updates for ${gameTitle}!`);
  } else {
    // User was already subscribed
    bot.sendMessage(chatId, `You have already subscribed to the ${gameTitle} feed!`);
  }
}

/** @description Handle game unsubscriptions.
 *
 * @param  {Object} msg - The Telegram msg object that triggered the event.
 * @param  {string} alias - The alias of the game to unsubscribe from.
 */
function onGameUnsub(msg, alias) {
  const chatId = msg.chat.id;
  const userName = msg.chat.username;

  if (Util.isEmptyOrWhitespace(alias)) {
    // The user didn't provide the game to unsubscribe from
    bot.sendMessage(chatId, `Use this command to unsubscribe from a game feed.\nTry \`${prefix}unsubscribe <GAME NAME>\`!`, { parse_mode: 'Markdown' });
    return;
  }

  const gameName = Data.getGameName(alias);

  if (!gameName) {
    // The game does not exist
    bot.sendMessage(chatId, `We don't know a game named "${alias.trim()}"!`);
    return;
  }

  const gameTitle = Data.getGameTitle(gameName);

  if (Data.removeSubscriber(chatId, 'telegram', gameName)) {
    // Confirm unsubscription
    console.info(`[Telegram] ${userName} unsubscribed from the ${gameTitle} feed.`);
    bot.sendMessage(chatId, `I will no longer notify you about any updates for ${gameTitle}!`);
  } else {
    // User wasn't subscribed
    bot.sendMessage(chatId, `You have never subscribed to the ${gameTitle} feed in the first place!`);
  }
}

/*
 * ------------------
 * COMMANDS
 * ------------------
 */

/** Handle game subscription */
bot.onText(new RegExp(`^${regPrefix}subscribe(?<alias>.*)$`), (msg, match) => {
  const { alias } = match.groups;
  onGameSub(msg, alias);
});

/** Handle game unsubscription */
bot.onText(new RegExp(`^${regPrefix}unsubscribe(?<alias>.*)$`), (msg, match) => {
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
