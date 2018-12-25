const Discord = require('discord.js');
const Data = require('./data');
const Util = require('./util');

const bot = new Discord.Client();
const { token } = Data.getBotConfig().discord;
const { prefix } = Data.getBotConfig().discord;
const regPrefix = Util.escapeRegExp(prefix);

function sendMessageByChat(chat, text) {
  const dest = (chat.type === 'dm') ? 'users' : 'channels';
  if (bot[dest] && bot[dest].get(chat.id)) {
    bot[dest].get(chat.id).send(text);
  }
}

function notifySubs(game, feed) {
  const subscribers = Data.getSubscribersByGameAndClient('discord', game);
  const entries = feed.newEntries;

  entries.forEach((entry) => {
    const text = entry.toString();
    subscribers.forEach((chat) => {
      sendMessageByChat(chat, text);
    });
  });
}

/** @description Handle game subscriptions.
 *
 * @param  {Object} msg - The Telegram msg object that triggered the event.
 * @param  {string} alias - The alias of the game to subscribe to.
 */
function onGameSub(msg, alias) {
  const chatId = msg.channel.id;
  const userName = msg.author.username;

  if (Util.isEmptyOrWhitespace(alias)) {
    // The user didn't provide the game to subscribe to
    msg.reply(`Use this command to subscribe to a game feed.\nTry \`\`${prefix}subscribe <GAME NAME>\`\`!`);
    return;
  }

  const gameName = Data.getGameName(alias);

  if (!gameName) {
    // The game does not exist
    msg.reply(`We don't know a game named "${alias.trim()}"!`);
    return;
  }

  const gameTitle = Data.getGameTitle(gameName);
  const channelType = msg.channel.type;

  if (Data.addSubscriber(chatId, channelType, 'discord', gameName)) {
    // Confirm subscription
    console.info(`[Discord] ${userName} subscribed to the ${gameTitle} feed.`);
    msg.reply(`I will notify you about any updates for ${gameTitle}!`);
  } else {
    // User was already subscribed
    msg.reply(`You have already subscribed to the ${gameTitle} feed!`);
  }
}

/** @description Handle game unsubscriptions.
 *
 * @param  {Object} msg - The Telegram msg object that triggered the event.
 * @param  {string} alias - The alias of the game to unsubscribe from.
 */
function onGameUnsub(msg, alias) {
  const chatId = msg.channel.id;
  const userName = msg.author.username;

  if (Util.isEmptyOrWhitespace(alias)) {
    // The user didn't provide the game to unsubscribe from
    msg.reply(`Use this command to unsubscribe from a game feed.\nTry \`\`${prefix}unsubscribe <GAME NAME>\`\`!`);
    return;
  }

  const gameName = Data.getGameName(alias);

  if (!gameName) {
    // The game does not exist
    bot.sendMessage(chatId, `We don't know a game named "${alias.trim()}"!`);
    return;
  }

  const gameTitle = Data.getGameTitle(gameName);
  const channelType = msg.channel.type;

  if (Data.removeSubscriber(chatId, channelType, 'discord', gameName)) {
    // Confirm unsubscription
    console.info(`[Discord] ${userName} unsubscribed from the ${gameTitle} feed.`);
    msg.reply(`I will no longer notify you about any updates for ${gameTitle}!`);
  } else {
    // User wasn't subscribed
    msg.reply(`You have never subscribed to the ${gameTitle} feed in the first place!`);
  }
}
/** @description Handle command registrations.
 *
 * @param  {Object} msg - The Discord msg object that triggered the event.
 * @param  {RegExp} regex - The regular expression that shall trigger the command.
 * @param  {Function} handler - The function to handle the command.
 */
function onText(msg, regex, handler) {
  // Run regex on the msg
  const match = regex.exec(msg);

  // If the regex matched, execute the handler function
  if (match) {
    handler(msg, match);
  }
}

/** Handle any messages to the bot. */
bot.on('message', (message) => {
  /** Handle game subscription */
  onText(message, new RegExp(`^${regPrefix}subscribe(?<alias>.*)$`), (msg, match) => {
    const { alias } = match.groups;
    onGameSub(msg, alias);
  });

  /** Handle game unsubscription */
  onText(message, new RegExp(`^${regPrefix}unsubscribe(?<alias>.*)$`), (msg, match) => {
    const { alias } = match.groups;
    onGameUnsub(msg, alias);
  });
});

bot.on('ready', () => {
  console.info(`[Discord] Logged in as ${bot.user.tag}.`);
});

/** @description Start the Discord bot. */
async function start() {
  if (token) {
    console.info('[Discord] Starting bot.');
    bot.login(token);
  } else {
    console.warn('[Discord] Token not provided, start ommited. Set the token in "bot_config.json".');
  }
}

module.exports = {
  start,
  notifySubs,
};
