class Game {
  public name: string;
  public aliases: string[];
  public label: string;

  constructor(name: string, aliases: string[], label: string) {
    this.name = name;
    this.aliases = aliases;
    this.label = label;
  }
}
