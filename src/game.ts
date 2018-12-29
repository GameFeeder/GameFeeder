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
}
