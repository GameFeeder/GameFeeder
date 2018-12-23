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

// Export the functions
module.exports = {
  getBotConfig,
  getFilePath,
  writeJSON,
  readJSON,
};
