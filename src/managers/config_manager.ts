import FileManager from './file_manager.js';

/** The available config files. */
export enum CONFIG {
  'API',
  'UPDATER',
}

/** The configuration settings for a bot. */
export type BotSettings = {
  /** Determines whether the bot starts automatically at the launch of the program.  */
  enabled: boolean;
  /** The default prefix the bot is using. */
  prefix: string;
  /** The token used to log into the bot. */
  token: string;
  /** The list of ID's representing the bot's owners. */
  owners: string[];
};

/** The configuration settings for the bots. */
export type BotConfig = {
  /** Access the BotConfig of the bot with the given name. */
  [botName: string]: BotSettings;
  /** The BotConfig of the Discord bot. */
  discord: BotSettings;
  /** The BotConfig of the Telegram bot. */
  telegram: BotSettings;
};

/** The configuration settings for Rollbar error tracking. */
export type RollbarConfig = {
  /** Determines whether Rollbar error tracking is enabled. */
  enabled: boolean;
  /** The access token used to authenticate with Rollbar. */
  accessToken: string;
};

/** The configuration settings for the used APIs. */
export type APIConfig = {
  /** The configuration settings for the bots. */
  bots: BotConfig;
  /** The configuration settings for Rollbar error tracking. */
  rollbar: RollbarConfig;
};

/** An RSS provider. */
export type RSSProvider = {
  /** The name of the rss feed. */
  label: string;
  /** The URL of the rss feed. */
  url: string;
  /** The flavor of the rss feed. */
  flavor: string;
};

/** The Steam provider for a game. */
export type SteamProvider = {
  /** The ID of the Steam app. */
  appID: number;
  /** The relevant news feeds of the Steam app. */
  feeds: string[];
};

/** A Telegram IV template. */
export type TelegramIVTemplate = {
  /** The domain to apply the IV template to. */
  domain: string;
  /** The hash of the IV template to use on that domain. */
  templateHash: string;
};

/** The settings of a game. */
export type GameSettings = {
  /** The internal name of the game. (Identification) */
  name: string;
  /** The human readable name of the game. */
  label: string;
  /** The aliases the game has. */
  aliases: string[];
  /** The main color of the game. */
  color: string;
  /** The icon of the game. */
  icon: string;
  /** The providers of the game. */
  providers: {
    /** The Steam provider of the game. */
    steam: SteamProvider;
    /** The rss providers of the game. */
    rss: RSSProvider[];
  };
  /** The Telegram IV templates of the game. */
  telegramIVTemplates: TelegramIVTemplate[];
};

/** The config of an updater. */
export type UpdaterConfig = {
  /** The delay in seconds between each game within an update cycle. */
  gameInterval: number;
  /** The delay in seconds between each update cycle. */
  cycleInterval: number;
  /** The maximum amount of notifications to send at once (e.g. after a restart). */
  limit: number;
  /** Determines whether the updater should start automatically. */
  enabled: boolean;
  /** Determines whether the bot saves the update parameters (disable for testing). */
  autosave: boolean;
};

/** The config of all updaters */
export type UpdatersConfig = Record<string, UpdaterConfig>;

/** The class that handles the config files. */
export default class ConfigManager {
  /** The base path of the config files. */
  public static basePath = 'config/';
  public static ext = '.json';

  /** The file name of the API config. */
  private static apiFileName = 'api_config';
  /** The file name of the updater config. */
  private static updaterFileName = 'updater_config';
  /** The name of the games folder. */
  private static gamesFolder = 'games/';

  /** Gets the name of the given file.
   *
   * @param file - The file to get the name of.
   */
  private static getFileName(file: CONFIG): string {
    switch (file) {
      case CONFIG.API:
        return this.apiFileName + this.ext;
      case CONFIG.UPDATER:
        return this.updaterFileName + this.ext;
      default:
        throw Error('Unknown config file.');
    }
  }

  /** Parses the given config file.
   *
   * @param file - The config file to parse.
   */
  public static parseFile(file: CONFIG): Record<string, unknown> {
    return FileManager.parseFile(this.basePath, this.getFileName(file));
  }

  /** Writes the given object to the given file.
   *
   * @param file - THe config file to write to.
   * @param object - The object to write.
   */
  public static writeObject(file: CONFIG, object: Record<string, unknown>): void {
    return FileManager.writeObject(this.basePath, this.getFileName(file), object);
  }

  // Config getters and setters

  /** Gets the API config object. */
  public static getAPIConfig(): APIConfig {
    return this.parseFile(CONFIG.API) as APIConfig;
  }

  /** Sets the API config object. */
  public static setAPIConfig(config: APIConfig): void {
    return this.writeObject(CONFIG.API, config);
  }

  /** Gets the bot config object. */
  public static getBotConfig(): BotConfig {
    return this.getAPIConfig().bots;
  }

  /** Sets the bot config object. */
  public static setBotConfig(config: BotConfig): void {
    const apiConfig = this.getAPIConfig();
    apiConfig.bots = config;

    this.setAPIConfig(apiConfig);
  }

  /** Gets the rollbar config object. */
  public static getRollbarConfig(): RollbarConfig {
    return this.getAPIConfig().rollbar;
  }

  /** Sets the rollbar config object. */
  public static setRollbarConfig(config: RollbarConfig): void {
    const apiConfig = this.getAPIConfig();
    apiConfig.rollbar = config;

    this.setAPIConfig(apiConfig);
  }

  /** Gets the game config object. */
  public static getGameConfig(): GameSettings[] {
    const gamesPath = this.basePath + this.gamesFolder;
    const gameSettingsFiles = FileManager.getFiles(gamesPath);
    const gameConfig: GameSettings[] = [];

    for (const file of gameSettingsFiles) {
      const setting: GameSettings = FileManager.parseFile(gamesPath, file) as GameSettings;
      gameConfig.push(setting);
    }

    return gameConfig;
  }

  /** Gets the updater config object. */
  public static getUpdatersConfig(): UpdatersConfig {
    return this.parseFile(CONFIG.UPDATER) as UpdatersConfig;
  }

  /** Sets the updater config object. */
  public static setUpdatersConfig(config: UpdatersConfig): void {
    this.writeObject(CONFIG.UPDATER, config);
  }
}
