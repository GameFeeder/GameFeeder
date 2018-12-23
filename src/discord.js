const Discord = require('discord.js');
const Data = require('./data');

const bot = new Discord.Client();
const { token } = Data.getBotConfig().discord;
const { prefix } = Data.getBotConfig().discord;

function onDotaSub(msg) {
  const chatId = msg.channel.id;
  const userName = msg.author.username;

  if (Data.addSubscriber(chatId, 'discord', 'dota')) {
    // Confirm subscription
    console.info(`[Discord] ${userName} subscribed to the Dota feed.`);
    msg.reply('I will notify you in case of updates!');
  } else {
    // User was already subscribed
    msg.reply('You have already subscribed!');
  }
}

function onDotaUnsub(msg) {
  const chatId = msg.channel.id;
  const userName = msg.author.username;

  if (Data.removeSubscriber(chatId, 'discord', 'dota')) {
    // Confirm unsubscription
    console.info(`[Discord] ${userName} unsubscribed from the Dota feed.`);
    msg.reply('I will no longer notify you on any updates.');
  } else {
    // User wasn't subscribed
    msg.reply('You never subscribed in the first place!');
  }
}

bot.on('message', (msg) => {
  switch (msg.content) {
    case `${prefix}subscribe dota`:
      onDotaSub(msg);
      break;
    case `${prefix}unsubscribe dota`:
      onDotaUnsub(msg);
      break;
    default:
  }
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
