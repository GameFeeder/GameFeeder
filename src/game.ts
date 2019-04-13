import { getDataConfig } from './data';
import botLogger from './bot_logger';
import Provider from './provider';
import BlogProvider from './provider_blog';
import RedditProvider from './provider_reddit';
import RedditUserProvider from './reddit_user';
import DotaProvider from './provider_dota';

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

for (const game of getDataConfig().games) {
  // Add providers
  const providers: Provider[] = [];
  // Reddit providers
  if (game.providers.reddit.users) {
    const subreddit = game.providers.reddit.subreddit;
    // tslint:disable-next-line prefer-array-literal
    const users: Array<{ name: string; titleFilter: string }> = game.providers.reddit.users;
    const redditUsers = users.map((user) => new RedditUserProvider(user.name, user.titleFilter));
    providers.push(new RedditProvider(redditUsers, subreddit, game));
  }
  // Blog providers
  if (game.providers.blogs) {
    for (const blog of game.providers.blogs) {
      providers.push(new BlogProvider(blog.url, blog.label, game));
    }
  }
  games.push(new Game(game.name, game.aliases, game.label, game.color, game.icon, providers));
}

// Unique providers
Game.getGameByName('dota').providers.push(new DotaProvider());

export default games;
export { Game, games };
