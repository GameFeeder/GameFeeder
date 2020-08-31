import BotClient from './bots/bot';
import Game from './game';
import DataManager from './managers/data_manager';

/** A representation of a bot's channel. */
export default class Channel {
  /** The unique ID of the channel. */
  public id: string;

  /** The label of the channel (if specified). */
  private _label?: string;
  get label(): string {
    const ID = `${this.bot.name.substr(0, 1).toLocaleUpperCase()}|${this.id}`;
    return this._label ? `'${this._label}' (${ID})` : ID;
  }
  set label(value: string) {
    const newLabel = value;

    // Save locally
    this._label = newLabel;

    // Save in the JSON file
    const subscribers = DataManager.getSubscriberData();
    const channels = subscribers[this.bot.name];

    // Check if the channel is already registered
    const existingChannelId = channels.findIndex((ch) => this.isEqual(ch.id));
    if (existingChannelId >= 0) {
      const existingChannel = channels[existingChannelId];
      // Update label
      existingChannel.label = newLabel;

      // Remove unnecessary entries
      if (
        existingChannel.gameSubs.length === 0 &&
        !existingChannel.prefix &&
        !existingChannel.label
      ) {
        this.bot.logger.info(`Removing unnecessary entry for channel ${this.label}...`);
        channels.splice(existingChannelId, 1);
      } else {
        channels[existingChannelId] = existingChannel;
      }
      // Save changes
      subscribers[this.bot.name] = channels;
      DataManager.setSubscriberData(subscribers);
    } else {
      // Add channel with the new label
      channels.push({
        gameSubs: [],
        id: this.id,
        label: newLabel,
      });
      // Save the changes
      subscribers[this.bot.name] = channels;
      DataManager.setSubscriberData(subscribers);
    }
  }

  /** The BotClient this channel is used in. */
  public bot: BotClient;
  /** The games this channel is subscribed to. */
  public gameSubs: Game[];

  /** The prefix the channel uses. */
  private _prefix: string;
  get prefix(): string {
    if (this._prefix) {
      return this._prefix;
    }
    return this.bot.prefix;
  }
  set prefix(value: string) {
    let newPrefix = value;
    // Check if the user wants to reset the prefix
    this.bot.logger.debug(newPrefix);
    if (newPrefix === 'reset') {
      newPrefix = this.bot.prefix;
    }

    this.bot.sendMessage(this, `Changing the bot's prefix on this channel to \`${newPrefix}\`.`);

    // Save locally
    this._prefix = newPrefix;

    // Save in the JSON file
    const subscribers = DataManager.getSubscriberData();
    const channels = subscribers[this.bot.name];

    // Check if the channel is already registered
    const existingChannelId = channels.findIndex((ch) => this.isEqual(ch.id));
    if (existingChannelId >= 0) {
      const existingChannel = channels[existingChannelId];
      // Update prefix
      existingChannel.prefix = newPrefix !== this.bot.prefix ? newPrefix : undefined;

      // Remove unnecessary entries
      if (existingChannel.gameSubs.length === 0 && !existingChannel.prefix) {
        this.bot.logger.debug('Removing unnecessary channel entry...');
        channels.splice(existingChannelId, 1);
      } else {
        channels[existingChannelId] = existingChannel;
      }
      // Save changes
      subscribers[this.bot.name] = channels;
      DataManager.setSubscriberData(subscribers);
    } else {
      // Add channel with the new prefix
      channels.push({
        gameSubs: [],
        id: this.id,
        prefix: newPrefix,
      });
      // Save the changes
      subscribers[this.bot.name] = channels;
      DataManager.setSubscriberData(subscribers);
    }
  }

  // Disabled channels won't receive automatic updates
  private _disabled: boolean;
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    // Save locally
    this._disabled = value;

    // Save in the JSON file
    const subscribers = DataManager.getSubscriberData();
    const channels = subscribers[this.bot.name];

    // Check if the channel is already registered
    const existingChannelId = channels.findIndex((ch) => this.isEqual(ch.id));
    if (existingChannelId < 0) {
      return;
    }
    const existingChannel = channels[existingChannelId];

    // Update status
    existingChannel.disabled = value;
    // Delete disabled = false entries to save space
    if (value === false) {
      delete existingChannel.disabled;
    }

    // Save the changes
    subscribers[this.bot.name] = channels;
    DataManager.setSubscriberData(subscribers);
  }

  /** Creates a new Channel. */
  constructor(
    id: string,
    bot: BotClient,
    gameSubs?: Game[],
    prefix?: string,
    label?: string,
    disabled = false,
  ) {
    this.id = id;
    this.bot = bot;
    this.gameSubs = gameSubs || [];
    this._prefix = prefix;
    this._label = label;
    this._disabled = disabled;
  }
  /** Compares the channel to another channel.
   *
   * @param  {IBotChannel} other - The other channel to compare to.
   * @returns {boolean} True, if the channels are equal, else false.
   */
  public isEqual(other: Channel | string): boolean {
    if (typeof other === 'string') {
      return this.id === other;
    }
    return this.id === other.id;
  }
  public toJSON(): string {
    const labelStr = this._label ? `, "label": "${this._label}"` : '';
    const prefixStr = this._prefix ? `, "prefix": "${this._prefix}"` : '';
    return `{
      "id": "${this.id}"${labelStr},
      "gameSubs": [
        ${this.gameSubs.map((game) => game.name).join(', ')}
      ]${prefixStr}
    }`;
  }

  /** Gets the number of users in this channel
   *
   * @returns The number of users in this channel
   */
  public async getUserCount(): Promise<number> {
    return this.bot.getChannelUserCount(this);
  }

  hasLabel(): boolean {
    return !!this._label;
  }
}
