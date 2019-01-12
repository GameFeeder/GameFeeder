import { getDataConfig } from './data';
import Provider from './provider';
import BlogProvider from './provider_blog';
import RedditProvider from './provider_reddit';

/** A representation of a game. */
class Game {
  /** The internal name of the game. */
  public name: string;
  /** The aliases the game uses. */
  public aliases: string[];
  /** The human-formatted label of the game. */
  public label: string;

  public providers: Provider[];

  /** Creates a new Game.
   *
   * @param  {string} name - The internal name of the game.
   * @param  {string[]} aliases - The aliases the game uses.
   * @param  {string} label - The human-formatted label of the game.
   */
  constructor(name: string, aliases: string[], label: string, providers: Provider[]) {
    this.name = name;
    this.aliases = aliases;
    this.label = label;
    this.providers = providers;
  }

  public hasAlias(alias: string) {
    // Ignore casing
    alias = alias.toLocaleLowerCase();

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

for (const game of getDataConfig(). games) {
  // Add providers
  const providers: Provider[] = [];
  // Reddit providers
  if (game.providers.reddit.usernames) {
    for (const redditUser of game.providers.reddit.usernames) {
      providers.push(new RedditProvider(redditUser));
    }
  }
  // Blog providers
  if (game.providers.blogs) {
    for (const blog of game.providers.blogs) {
      providers.push(new BlogProvider(blog.url, blog.label));
    }
  }

  games.push(new Game(game.name, game.aliases, game.label, providers));
}

export default games;
export { Game, games };
