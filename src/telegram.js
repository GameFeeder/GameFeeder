const TelegramBot = require('node-telegram-bot-api');
const Util = require('./util');

// Get the Telegram bot token from the bot_config.json
const { token } = Util.getBotConfig().telegram;

// Create the bot
const bot = new TelegramBot(token, { polling: true });

/**
 * Add a Telegram chat to the subscriptions.
 * @param  {number} chatId - The ID of the chat to be subscribed.
 * @returns {boolean} false, if the chat was already subscribed, else true.
 */
function addDotaSubscriber(chatId) {
  const subscribers = Util.readJSON(Util.getFilePath('subscribers'));
  const dotaSubscribers = subscribers.telegram.dota;

  // Check if the chat is already subscribed
  if (dotaSubscribers.includes(chatId)) {
    return false;
  }

  // Add chat to subscription list
  dotaSubscribers.push(chatId);
  // Save changes
  subscribers.telegram.dota = dotaSubscribers;
  Util.writeJSON(Util.getFilePath('subscribers'), subscribers);
  return true;
}


/**
 * Remove a Telegram chat from the subscriptions.
 * @param  {number} chatId - The Id of the chat to be unsubscribed.
 * @returns {boolean} false, if the chat wasn't subscribed, else true.
 */
function removeDotaSubscriber(chatId) {
  const subscribers = Util.readJSON(Util.getFilePath('subscribers'));
  let dotaSubscribers = subscribers.telegram.dota;

  // Check if the chat isn't subscribed
  if (!dotaSubscribers.includes(chatId)) {
    return false;
  }

  // Unsubscribe chat
  dotaSubscribers = dotaSubscribers.filter(value => value !== chatId);
  // Save changes
  subscribers.telegram.dota = dotaSubscribers;
  Util.writeJSON(Util.getFilePath('subscribers'), subscribers);
  return true;
}

/** Handle user subscriptions */
bot.onText(/\/subscribe/, (msg) => {
  const chatId = msg.chat.id;
  const chatUser = msg.chat.username;

  if (addDotaSubscriber(chatId)) {
    // Confirm subscription
    console.info(`[Telegram] ${chatUser} subscribed to the Dota feed.`);
    bot.sendMessage(chatId, 'I will notify you in case of updates!');
  } else {
    // User was already subscribed
    bot.sendMessage(chatId, 'You have already subscribed!');
  }
});

/** Handle user unsubscriptions */
bot.onText(/\/unsubscribe/, (msg) => {
  const chatId = msg.chat.id;
  const chatUser = msg.chat.username;

  if (removeDotaSubscriber(chatId)) {
    // Confirm unsubscription
    console.info(`[Telegram] ${chatUser} unsubscribed from the Dota feed.`);
    bot.sendMessage(chatId, 'I will no longer notify you about any updates!');
  } else {
    // User wasn't subscribed
    bot.sendMessage(chatId, 'You have never subscribed in the first place!');
  }
});
