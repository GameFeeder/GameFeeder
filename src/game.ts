import ConfigManager, { reddit_user } from './config_manager';
import botLogger from './bot_logger';
import Provider from './provider';
import BlogProvider from './provider_blog';
import RedditProvider from './provider_reddit';
import RedditUserProvider from './reddit_user';

/** A representation of a game. */
class Game {
  /** Gets a game by its name.
   *
   * @param name - The name of the game.
   * @returns The game with this name.
   */
  public static getGameByName(name: string): Game {
    for (const game of games) {
      if (game.name === name) {
        return game;
      }
    }
    return null;
  }

  /** The internal name of the game. */
  public name: string;
  /** The aliases the game uses. */
  public aliases: string[];
  /** The human-formatted label of the game. */
  public label: string;
  /** The color representing the game. */
  public color: string;
  /** The game icon. */
  public icon: string;

  public providers: Provider[];

  /** Creates a new Game.
   *
   * @param  {string} name - The internal name of the game.
   * @param  {string[]} aliases - The aliases the game uses.
   * @param  {string} label - The human-formatted label of the game.
   */
  constructor(
    name: string,
    aliases: string[],
    label: string,
    color: string,
    icon: string,
    providers: Provider[],
  ) {
    this.name = name;
    this.aliases = aliases;
    this.label = label;
    this.color = color;
    this.icon = icon;
    this.providers = providers;
  }

  public hasAlias(aliasText: string) {
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
}

// All Games
const games: Game[] = [];

for (const gameSettings of ConfigManager.getGameConfig()) {
  const game = new Game(
    gameSettings.name,
    gameSettings.aliases,
    gameSettings.label,
    gameSettings.color,
    gameSettings.icon,
    null,
  );

  // Add providers
  const providers: Provider[] = [];
  // Reddit providers
  if (gameSettings.providers.reddit.users) {
    const subreddit = gameSettings.providers.reddit.subreddit;
    // tslint:disable-next-line prefer-array-literal
    const users: reddit_user[] = gameSettings.providers.reddit.users;
    const redditUsers = users.map((user) => new RedditUserProvider(user.name, user.filter));
    providers.push(new RedditProvider(redditUsers, subreddit, game));
  }
  // Blog providers
  if (gameSettings.providers.blogs) {
    for (const blog of gameSettings.providers.blogs) {
      providers.push(new BlogProvider(blog.url, blog.label, game));
    }
  }
  game.providers = providers;

  games.push(game);
}

export default games;
export { Game, games };
