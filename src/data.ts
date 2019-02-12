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
function readJSON(path: string): object {
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
  const basePath = 'src/data';

  switch (file) {
    case 'subscribers':
      return `${basePath}/subscribers.json`;
    case 'bot_config':
      return `${basePath}/bot_config.json`;
    case 'data_config':
      return `${basePath}/data_config.json`;
    default:
      throw new SyntaxError('Unexpected file.');
  }
}

/** @description Get the bot_config.json file as a JS object. */
function getBotConfig(): any {
  const apiConfig: any = readJSON(getFilePath('bot_config'));
  return apiConfig.bots;
}

function getRedditConfig(): any {
  const apiConfig: any = readJSON(getFilePath('bot_config'));
  return apiConfig.reddit;
}

/** @description Get the data_conig.json file as a JS object. */
function getDataConfig(): any {
  return readJSON(getFilePath('data_config'));
}

function setDataConfig(data: object): void {
  writeJSON(getFilePath('data_config'), data);
}

function getSubscribers(): any {
  return readJSON(getFilePath('subscribers'));
}

function setSubscribers(subscribers: object): void {
  writeJSON(getFilePath('subscribers'), subscribers);
}

export { getBotConfig, getDataConfig, setDataConfig, getRedditConfig, getSubscribers, setSubscribers };
