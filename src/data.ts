import FS from 'fs';

/** @description Reads the content of the specified file.
 *
 * @param {string} path - The file path to the file.
 * @returns {string} The content of the file.
 */
function readFile(path: string): string {
  return FS.readFileSync(path, 'utf8');
}

/** @description Writes the specified content to the specified file.
 *
 * @param {string} path - The file path to the file.
 * @param {string} content - The string to write to the file.
 */
function writeFile(path: string, content: string): void {
  FS.writeFileSync(path, content);
}

/** @description Returns the JS object representation of the specified JSON file.
 *
 * @param {string} path - The file path to the JSON file.
 */
function readJSON(path: string): any {
  return JSON.parse(readFile(path));
}

/** @description Writes the specified JS object to the specified JSON file.
 *
 * @param {string} path - The path to the JSON file.
 * @param {Object} obj - The JS object to write to the JSON file.
 */
function writeJSON(path: string, obj: object): void {
  writeFile(path, JSON.stringify(obj, null, 2));
}

/** @description Get the path of important files.
 *
 * @param {string} file - The file to get the path from.
 * @returns {string} The path of the file.
 */
function getFilePath(file: string): string {
  const basePath = 'config/';

  switch (file) {
    case 'subscribers':
      return `${basePath}/subscribers.json`;
    case 'bot_config':
      return `${basePath}/bot_config.json`;
    case 'data_config':
      return `${basePath}/data_config.json`;
    case 'updater_config':
      return `${basePath}/updater_config.json`;
    default:
      throw new SyntaxError(`Unexpected file: '${file}'.`);
  }
}

/** The configuration settings for a bot. */
export type bot_config = {
  /** Determines whether the bot starts automatically at the launch of the program.  */
  autostart: boolean,
  /** The default prefix the bot is using. */
  prefix: string,
  /** The token used to log into the bot. */
  token: string,
  /** The list of ID's representing the bot's owners. */
  owners: string[],
};

/** The configuration settings for the bots. */
export type bots_config = {
  /** Access the bot_config of the bot with the given name. */
  [ botName: string ]: bot_config,
  /** The bot_config of the Discord bot. */
  discord: bot_config,
  /** The bot_config of the Telegram bot. */
  telegram: bot_config,
};

/** The configuration settings for the reddit client. */
export type reddit_config = {
  /** The client id used by the reddit client. */
  clientId: string,
  /** The client secret used by the reddit client. */
  clientSecret: string,
  /** The refresh token used by the reddit client. */
  refreshToken: string,
  /** The user agent used by the reddit client. */
  userAgent: string,
};

/** The configuration settings for the used APIs. */
export type api_config = {
  /** The configuration settings for the bots. */
  bots: bots_config,
  /** The configuration settings for the reddit client. */
  reddit: reddit_config,
};

/** Get the bot_config.json file as a JS object. */
function getBotConfig(): bots_config {
  const apiConfig: api_config = readJSON(getFilePath('bot_config'));
  return apiConfig.bots;
}

/** Get the Reddit configuration settings. */
function getRedditConfig(): reddit_config {
  const apiConfig: api_config = readJSON(getFilePath('bot_config'));
  return apiConfig.reddit;
}

/** Get the data_config.json file as a JS object. */
function getDataConfig(): any {
  return readJSON(getFilePath('data_config'));
}

export type updater_config = {
  updater: {
    updateDelaySec: number,
    limit: number,
    lastUpdate: string,
    lastDotaPatch: string,
    autostart: boolean,
    autosave: boolean,
  },
};

function getUpdaterConfig(): updater_config {
  return readJSON(getFilePath('updater_config'));
}

function setUpdaterConfig(data: updater_config): void {
  writeJSON(getFilePath('updater_config'), data);
}

export type subscriber = {
  gameSubs: string[],
  id: string,
  prefix: string,
};

export type subscribers = {
  [index: string]: subscriber[],
  discord: subscriber[],
  telegram: subscriber[],
};

function getSubscribers(): subscribers {
  return readJSON(getFilePath('subscribers'));
}

function setSubscribers(subscribers: subscribers): void {
  writeJSON(getFilePath('subscribers'), subscribers);
}

export {
  getBotConfig,
  getDataConfig,
  getUpdaterConfig,
  setUpdaterConfig,
  getRedditConfig,
  getSubscribers,
  setSubscribers,
};
