import ConfigManager, { RedditUser } from './managers/config_manager';
import Provider from './providers/provider';
import RSSProvider from './providers/rss_provider';
import SubredditProvider from './providers/subreddit_provider';
import RedditUserProvider from './reddit/reddit_user';
import DotaProvider from './providers/dota_provider';
import TelegramIVTemplate from './telegram_iv_template';
import SteamProvider from './providers/steam_provider';
import RedditProvider from './providers/reddit_provider';

export type Providers = {
  [index: string]: Provider;
};

/** A representation of a game. */
export default class Game {
  private static games: Game[];

  /**
   * Creates an instance of Game.
   * @param {string} name The internal name of the game.
   * @param {string[]} aliases The aliases the game uses.
   * @param {string} label The human-formatted label of the game.
   * @param {string} color The color representing the game.
   * @param {string} icon The game icon.
   * @param {Providers} providers The game providers.
   * @param {TelegramIVTemplate[]} telegramIVTemplates The Telegram IV templates.
   * @memberof Game
   */
  constructor(
    public name: string,
    public aliases: string[],
    public label: string,
    public color: string,
    public icon: string,
    public providers: Providers,
    public telegramIVTemplates: TelegramIVTemplate[],
  ) {}

  public hasAlias(aliasText: string): boolean {
    // Ignore casing
    const alias = aliasText.toLocaleLowerCase();

    if (alias === 'all') {
      return true;
    }

    if (alias === this.name.toLocaleLowerCase() || alias === this.label.toLocaleLowerCase()) {
      return true;
    }

    for (const entry of this.aliases) {
      if (entry === alias) {
        return true;
      }
    }

    return false;
  }

  /** Gets a game by its name.
   *
   * @param name - The name of the game.
   * @returns The game with this name.
   */
  public static getGameByName(name: string): Game {
    for (const game of this.getGames()) {
      if (game.name === name) {
        return game;
      }
    }
    throw new Error(`Failed to find game with name '${name}'`);
  }

  /** Returns an array of all available game aliases. */
  public static getAliases(): string[] {
    const games = this.getGames();
    // Merge all game aliases in a single array and add the 'all' alias
    return ['all'].concat(...games.map((game) => game.aliases));
  }

  /** Returns the available games. */
  public static getGames(): Game[] {
    if (this.games) {
      return this.games;
    }

    // All Games
    const games: Game[] = [];

    for (const gameSettings of ConfigManager.getGameConfig()) {
      const templates = gameSettings.telegramIVTemplates || [];
      const telegramIVtemplates = templates.map((template) => {
        return new TelegramIVTemplate(template.domain, template.templateHash);
      });

      const game = new Game(
        gameSettings.name,
        gameSettings.aliases,
        gameSettings.label,
        gameSettings.color,
        gameSettings.icon,
        {},
        telegramIVtemplates,
      );

      // Reddit providers
      if (gameSettings.providers.reddit) {
        const subredditProviders: SubredditProvider[] = [];
        gameSettings.providers.reddit.forEach((subredditConfig) => {
          if (subredditConfig.users) {
            const subreddit = subredditConfig.subreddit;
            const users: RedditUser[] = subredditConfig.users;
            const redditUsers = users.map(
              (user) => new RedditUserProvider(user.name, user.titleFilter),
            );
            const urlFilters = subredditConfig.urlFilters ? subredditConfig.urlFilters : [];
            subredditProviders.push(
              new SubredditProvider(redditUsers, subreddit, urlFilters, game),
            );
          }
        });
        game.providers.reddit = new RedditProvider(subredditProviders, game);
      }

      // Blog providers
      if (gameSettings.providers.rss) {
        for (const blog of gameSettings.providers.rss) {
          game.providers.rss = new RSSProvider(blog.url, blog.label, game, blog.flavor);
        }
      }
      // Steam providers
      if (gameSettings.providers.steam) {
        const steamSettings = gameSettings.providers.steam;
        game.providers.steam = new SteamProvider(steamSettings.appID, steamSettings.feeds, game);
      }

      games.push(game);
    }

    this.games = games;

    // Unique providers
    for (const game of games) {
      if (game.name === 'dota') {
        game.providers.dota = new DotaProvider();
      }
    }

    return this.games;
  }

  /** Gets all the games with the given alias. */
  public static getGamesByAlias(alias: string): Game[] {
    const aliasGames = this.getGames().filter((game) => {
      return game.hasAlias(alias);
    });

    return aliasGames;
  }
}
