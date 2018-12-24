const Discord = require('discord.js');
const Data = require('./data');
const Util = require('./util');

const bot = new Discord.Client();
const { token } = Data.getBotConfig().discord;
const prefix = Util.escapeRegExp(Data.getBotConfig().discord.prefix);

function onGameSub(msg, alias) {
  const chatId = msg.channel.id;
  const userName = msg.author.username;

  if (Util.isEmptyOrWhitespace(alias)) {
    // The user didn't provide the game to subscribe to
    msg.reply('Use this command to subscribe to a game feed.\nUse /subscribe <GAME NAME>!');
    return;
  }

  const gameName = Data.getGameName(alias);

  if (!gameName) {
    // The game does not exist
    msg.reply(`We don't know a game named "${alias.trim()}"!`);
    return;
  }

  const gameTitle = Data.getGameTitle(gameName);

  if (Data.addSubscriber(chatId, 'discord', gameName)) {
    // Confirm subscription
    console.info(`[Discord] ${userName} subscribed to the ${gameTitle} feed.`);
    msg.reply(`I will notify you about any updates for ${gameTitle}!`);
  } else {
    // User was already subscribed
    msg.reply(`You have already subscribed to the ${gameTitle} feed!`);
  }
}

function onGameUnsub(msg, alias) {
  const chatId = msg.channel.id;
  const userName = msg.author.username;

  if (Util.isEmptyOrWhitespace(alias)) {
    // The user didn't provide the game to unsubscribe from
    msg.reply('Use this command to unsubscribe from a game feed.\nUse /unsubscribe <GAME NAME>!');
    return;
  }

  const gameName = Data.getGameName(alias);

  if (!gameName) {
    // The game does not exist
    bot.sendMessage(chatId, `We don't know a game named "${alias.trim()}"!`);
    return;
  }

  const gameTitle = Data.getGameTitle(gameName);

  if (Data.removeSubscriber(chatId, 'discord', gameName)) {
    // Confirm unsubscription
    console.info(`[Discord] ${userName} unsubscribed from the ${gameTitle} feed.`);
    msg.reply(`I will no longer notify you about any updates for ${gameTitle}!`);
  } else {
    // User wasn't subscribed
    msg.reply(`You have never subscribed to the ${gameTitle} feed in the first place!`);
  }
}

function onText(msg, regex, handler) {
  // Run regex on the msg
  const match = regex.exec(msg);

  // If the regex matched, execute the handler function
  if (match) {
    handler(msg, match);
  }
}

bot.on('message', (message) => {
  /** Handle game subscription */
  onText(message, new RegExp(`^${prefix}subscribe(?<alias>.*)$`), (msg, match) => {
    const { alias } = match.groups;
    onGameSub(msg, alias);
  });

  /** Handle game unsubscription */
  onText(message, new RegExp(`^${prefix}unsubscribe(?<alias>.*)$`), (msg, match) => {
    const { alias } = match.groups;
    onGameUnsub(msg, alias);
  });
});

bot.on('ready', () => {
  console.info(`[Discord] Logged in as ${bot.user.tag}.`);
});

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
};
