import { getDataConfig } from './data';

/** A representation of a game. */
class Game {
  /** The internal name of the game. */
  public name: string;
  /** The aliases the game uses. */
  public aliases: string[];
  /** The human-formatted label of the game. */
  public label: string;

  /** Creates a new Game.
   *
   * @param  {string} name - The internal name of the game.
   * @param  {string[]} aliases - The aliases the game uses.
   * @param  {string} label - The human-formatted label of the game.
   */
  constructor(name: string, aliases: string[], label: string) {
    this.name = name;
    this.aliases = aliases;
    this.label = label;
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
getDataConfig().games.forEach((game: any) => {
  games.push(new Game(game.name, game.aliases, game.label));
});

export { Game, games };
