const fs = require('fs');

const subscriberPath = 'src/data/subscribers.json';
const botConfigPath = 'src/data/bot_config.json';

/** Reads the content of the specified file. */
function readFile(path) {
  return fs.readFileSync(path, 'utf8');
}

/** Writes the specified content to the specified file. */
function writeFile(path, content) {
  fs.writeFileSync(path, content);
}

/** Returns the JS object representation of the specified JSON file. */
function readJSON(path) {
  return JSON.parse(readFile(path));
}

/** Writes the specified JS object to the specified JSON file. */
function writeJSON(path, obj) {
  writeFile(path, JSON.stringify(obj, null, 2));
}

/** Get the path of important files. */
/**
 * @param {string} file - The file to get the path from.
 * @returns {string} The path of the file.
 */
function getFilePath(file) {
  switch (file) {
    case 'subscribers':
      return subscriberPath;
    case 'bot_config':
      return botConfigPath;
    default:
      throw new SyntaxError('Unexpected file.');
  }
}

/** Returns the bot_config.json file as a JS object. */
function getBotConfig() {
  return readJSON(getFilePath('bot_config'));
}

/**
 * Add a chat to the subscriptions.
 * @param  {number} chatId - The ID of the chat to be subscribed.
 * @param {string} client - The name of the client. 'telegram' or 'discord'.
 * @param {string} game - The name of the game to subscribe to. 'dota' or 'artifact'.
 * @returns {boolean} false, if the chat was already subscribed, else true.
 */
function addSubscriber(chatId, client, game) {
  const subscribers = readJSON(getFilePath('subscribers'));
  const gameSubscribers = subscribers[client][game];

  // Check if the chat is already subscribed
  if (gameSubscribers.includes(chatId)) {
    return false;
  }

  // Add chat to subscription list
  gameSubscribers.push(chatId);
  // Save changes
  subscribers[client][game] = gameSubscribers;
  writeJSON(getFilePath('subscribers'), subscribers);
  return true;
}

/**
 * Remove a chat from the subscriptions.
 * @param  {number} chatId - The Id of the chat to be unsubscribed.
 * @param {string} client - The name of the client. 'telegram' or 'discord'.
 * @param {string} game - The name of the game to unsubscribe from. 'dota' or 'artifact'.
 * @returns {boolean} false, if the chat wasn't subscribed, else true.
 */
function removeSubscriber(chatId, client, game) {
  const subscribers = readJSON(getFilePath('subscribers'));
  let gameSubscribers = subscribers[client][game];

  // Check if the chat isn't subscribed
  if (!gameSubscribers.includes(chatId)) {
    return false;
  }

  // Unsubscribe chat
  gameSubscribers = gameSubscribers.filter(value => value !== chatId);
  // Save changes
  subscribers[client][game] = gameSubscribers;
  writeJSON(getFilePath('subscribers'), subscribers);
  return true;
}

// Export the functions
module.exports = {
  getBotConfig,
  getFilePath,
  addSubscriber,
  removeSubscriber,
  writeJSON,
  readJSON,
};
