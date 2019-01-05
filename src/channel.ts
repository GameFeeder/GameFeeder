/** A representation of a bot's channel. */
abstract class BotChannel {
  /** The human-readable name of the channel. */
  public label: string;
  /** The unique ID of the channel. */
  public id: string;
  /** Creates a new BotChannel. */
  constructor(label: string, id: string) {
    this.label = label;
    this.id = id;
  }
  /** Compares the channel to another channel.
   *
   * @param  {IBotChannel} other - The other channel to compare to.
   * @returns {boolean} True, if the channels are equal, else false.
   */
  public abstract isEqual(other: BotChannel): boolean;
}

export { BotChannel };
