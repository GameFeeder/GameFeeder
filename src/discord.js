const Discord = require('discord.js');
const Util = require('./util');

const client = new Discord.Client();
const { token } = Util.getBotConfig().discord;
const { prefix } = Util.getBotConfig().discord;

/**
 * Add a Discord chat to the Dota subscriptions.
 * @param  {number} chatId - The ID of the chat to be subscribed.
 * @returns {boolean} false, if the chat was already subscribed, else true.
 */
function addDotaSubscriber(chatId) {
  const subscribers = Util.readJSON(Util.getFilePath('subscribers'));
  const dotaSubscribers = subscribers.discord.dota;

  // Check if the chat is already subscribed
  if (dotaSubscribers.includes(chatId)) {
    return false;
  }

  // Add chat to subscription list
  dotaSubscribers.push(chatId);
  // Save changes
  subscribers.discord.dota = dotaSubscribers;
  Util.writeJSON(Util.getFilePath('subscribers'), subscribers);
  return true;
}

/**
 * Remove a Discord chat from the Dota subscriptions.
 * @param  {number} chatId - The Id of the chat to be unsubscribed.
 * @returns {boolean} false, if the chat wasn't subscribed, else true.
 */
function removeDotaSubscriber(chatId) {
  let subscribers = Util.readJSON(Util.getFilePath('subscribers')).discord.dota;

  // Check if the chat isn't already subscribed
  if (!subscribers.includes(chatId)) {
    return false;
  }

  // Remove chat from subscription list
  subscribers = subscribers.filter(value => value === chatId);
  // Save changes
  Util.writeJSON(Util.getFilePath('subscribers'), subscribers);
  return true;
}

function onDotaSubscribe(msg) {
  if (addDotaSubscriber(msg)) {
    // Confirm subscription
    msg.reply('I will notify you in case of updates!');
  } else {
    // User was already subscribed
    msg.reply('You have already subscribed!');
  }
}

function onDotaUnsubscribe(msg) {
  if (removeDotaSubscriber(msg.chatId)) {
    // Confirm unsubscription
    msg.reply('I will no longer notify you on any updates.');
  } else {
    // User wasn't subscribed
    msg.reply('You never subscribed in the first place!');
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', (msg) => {
  switch (msg.content) {
    case `${prefix}subscribe dota`:
      onDotaSubscribe(msg);
      break;
    case `${prefix}unsubscribe dota`:
      onDotaUnsubscribe(msg);
      break;
    default:
  }
});

client.login(token);
