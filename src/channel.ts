/** A representation of a bot's channel. */
export default class BotChannel {
  /** The unique ID of the channel. */
  public id: string;
  /** Creates a new BotChannel. */
  constructor(id: string) {
    this.id = id;
  }
  /** Compares the channel to another channel.
   *
   * @param  {IBotChannel} other - The other channel to compare to.
   * @returns {boolean} True, if the channels are equal, else false.
   */
  public isEqual(other: BotChannel | string): boolean {
    if (typeof(other) === 'string') {
      return this.id === other;
    }
    return this.id === other.id;
  }
  public toJSON(): string {
    return this.id;
  }
}
