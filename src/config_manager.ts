import FileManager from './file_manager';

/** The available config files. */
export enum CONFIG {
  'API',
  'GAME',
  'UPDATER',
}

/** The configuration settings for a bot. */
export type bot_settings = {
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
export type bot_config = {
  /** Access the bot_config of the bot with the given name. */
  [botName: string]: bot_settings;
  /** The bot_config of the Discord bot. */
  discord: bot_settings;
  /** The bot_config of the Telegram bot. */
  telegram: bot_settings;
};

/** The configuration settings for the used APIs. */
export type api_config = {
  /** The configuration settings for the bots. */
  bots: bot_config;
  /** The configuration settings for the reddit client. */
  reddit: reddit_config;
};

/** The configuration settings for the reddit client. */
export type reddit_config = {
  /** The client id used by the reddit client. */
  clientId: string;
  /** The client secret used by the reddit client. */
  clientSecret: string;
  /** The refresh token used by the reddit client. */
  refreshToken: string;
  /** The user name of the bot owner. */
  userName: string;
};

/** A reddit user. */
export type reddit_user = {
  /** The name of the reddit user. */
  name: string;
  /** The regex to filter the post tiles by. */
  titleFilter: string;
};

/** The reddit providers for a game. */
export type reddit_providers = {
  /** The subreddit to search in. */
  subreddit: string;
  /** The relevant users in that subreddit. */
  users: reddit_user[];
};

/** A blog provider. */
export type blog_provider = {
  /** The name of the blog. */
  label: string;
  /** The URL of the blog. */
  url: string;
};

/** A Telegram IV template. */
export type telegramIVTemplate = {
  /** The domain to apply the IV template to. */
  domain: string;
  /** The hash of the IV template to use on that domain. */
  templateHash: string;
};

/** The settings of a game. */
export type game_settings = {
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
    /** The reddit providers of the game. */
    reddit: reddit_providers;
    /** The blog providers of the game. */
    blogs: blog_provider[];
  };
  /** The Telegram IV templates of the game. */
  telegramIVTemplates: telegramIVTemplate[];
};

/** The config of the games. */
export type game_config = game_settings[];

/** The config of the updater. */
export type updater_config = {
  /** The delay in seconds between each update. */
  updateDelaySec: number;
  /** The maximum amount of notifications to send at once (e.g. after a restart). */
  limit: number;
  /** Determines whether the updater should start automatically. */
  enabled: boolean;
  /** Determines whether the bot saves the update parameters (disable for testing). */
  autosave: boolean;
};

/** The class that handles the config files. */
export default class ConfigManager {
  /** The base path of the config files. */
  public static basePath = 'config/';
  public static ext = '.json';

  /** The file name of the API config. */
  private static apiFileName = 'api_config';
  /** The file name of the game config. */
  private static gameFileName = 'game_config';
  /** The file name of the updater config. */
  private static updaterFileName = 'updater_config';

  /** Gets the name of the given file.
   *
   * @param file - The file to get the name of.
   */
  private static getFileName(file: CONFIG): string {
    switch (file) {
      case CONFIG.API:
        return this.apiFileName + this.ext;
      case CONFIG.GAME:
        return this.gameFileName + this.ext;
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
  public static parseFile(file: CONFIG): any {
    return FileManager.parseFile(this.basePath, this.getFileName(file));
  }

  /** Writes the given object to the given file.
   *
   * @param file - THe config file to write to.
   * @param object - The object to write.
   */
  public static writeObject(file: CONFIG, object: any): any {
    return FileManager.writeObject(this.basePath, this.getFileName(file), object);
  }

  // Config getters and setters

  /** Gets the API config object. */
  public static getAPIConfig(): api_config {
    return this.parseFile(CONFIG.API);
  }

  /** Sets the API config object. */
  public static setAPIConfig(config: api_config): void {
    return this.writeObject(CONFIG.API, config);
  }

  /** Gets the bot config object. */
  public static getBotConfig(): bot_config {
    return this.getAPIConfig().bots;
  }

  /** Sets the bot config object. */
  public static setBotConfig(config: bot_config): void {
    const apiConfig = this.getAPIConfig();
    apiConfig.bots = config;

    this.setAPIConfig(apiConfig);
  }

  /** Gets the reddit config object. */
  public static getRedditConfig(): reddit_config {
    return this.getAPIConfig().reddit;
  }

  /** Sets the reddit config object. */
  public static setRedditConfig(config: reddit_config): void {
    const apiConfig = this.getAPIConfig();
    apiConfig.reddit = config;

    this.setAPIConfig(apiConfig);
  }

  /** Gets the game config object. */
  public static getGameConfig(): game_config {
    return this.parseFile(CONFIG.GAME).games;
  }

  /** Sets the game config object. */
  public static setGameConfig(config: game_config): void {
    this.writeObject(CONFIG.GAME, { games: config });
  }

  /** Gets the updater config object. */
  public static getUpdaterConfig(): updater_config {
    return this.parseFile(CONFIG.UPDATER);
  }

  /** Sets the updater config object. */
  public static setUpdaterConfig(config: updater_config): void {
    this.writeObject(CONFIG.UPDATER, config);
  }
}
