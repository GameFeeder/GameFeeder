import BotUser, { UserPermission } from './bot_user';
import BotChannel from './channel';
import Command from './command';
import { getBotConfig, getSubscribers, setSubscribers } from './data';
import { Game } from './game';
import botLogger from './logger';
import BotNotification from './notification';

export default abstract class BotClient {
  /** The internal name of the bot. */
  public name: string;
  /** The human-readable label of the bot. */
  public label: string;
  /** The prefix to use for commands. */
  public prefix: string;
  /** Indicator whether the bot is currently running. */
  public isRunning: boolean;
  /** Indicates whether the bot should be started automatically. */
  public autostart: boolean;

  /** Creates a new BotClient.
   *
   * @param  {string} name - The internal name of the bot.
   * @param  {string} label - The human-readable label of the bot.
   * @param  {string} prefix - The prefix to use for commands.
   * @param {boolean} autostart - Indicates whether the bot should be started automatically.
   */
  constructor(name: string, label: string, prefix: string, autostart: boolean) {
    this.name = name;
    this.label = label;
    this.prefix = prefix;
    this.autostart = autostart;
    this.isRunning = false;
  }

  /** Gets the username of the bot.
   *
   * @return The username of the bot.
   */
  public abstract async getUserName(): Promise<string>;

  /** Gets the usertag of the bot. Used as prefix.
   *
   * @return The usertag of the bot.
   */
  public abstract async getUserTag(): Promise<string>;

  /** Registers a bot command.
   *
   * @param  {Command} command - The command to register.
   * @returns void
   */
  public abstract registerCommand(command: Command): void;
  /** Start the bot.
   *
   * @returns True, if the start was successful, else false.
   */
  public abstract async start(): Promise<boolean>;
  /** Stop the bot.
   *
   * @returns void
   */
  public abstract stop(): void;

  /** Gets the permission of a user on a given channel.
   *
   * @param user - The user to get the permission of.
   * @param channel - The channel to get the permission on.
   */
  public abstract async getUserPermission(user: BotUser, channel: BotChannel): Promise<UserPermission>;

  /** Gets a list of the owners of the bot.
   *
   * @returns An array filled with the owner BotUsers of the bot.
   */
  public abstract async getOwners(): Promise<BotUser[]>;

  /** Add a channel supscription to a game.
   *
   * @param  {BotChannel} channel - The channel to subscribe to the game.
   * @param  {Game} game - The game to subscribe to.
   * @returns True, if the subscription was successful, else false.
   */
  public addSubscriber(channel: BotChannel, game: Game): boolean {
    const subscribers = getSubscribers();
    const channels = subscribers[this.name];

    // Check if the channel is already registered
    for (let i = 0; i < channels.length; i++) {
      const sub = channels[i];
      if (channel.isEqual(sub.id)) {
        // Check if the channel already subscribed to the game's feed
        for (const gameName of sub.gameSubs) {
          if (gameName === game.name) {
            return false;
          }
        }
        // Add the game to the subscriptions
        sub.gameSubs.push(game.name);
        channels[i] = sub;
        // Save the changes
        subscribers[this.name] = channels;
        setSubscribers(subscribers);
        return true;
      }
    }
    // Add the new subscriber
    channels.push({
      gameSubs: [game.name],
      id: channel.id,
      prefix: '',
    });
    // Save the changes
    subscribers[this.name] = channels;
    setSubscribers(subscribers);
    return true;
  }

  /** Remove a channel subscription from a game.
   *
   * @param  {BotChannel} channel - The channel to unsubscribe from the game.
   * @param  {Game} game - The game to unsubscribe from.
   * @returns True, if the unsubscription was successful, else false.
   */
  public removeSubscriber(channel: BotChannel, game: Game): boolean {
    const subscribers = getSubscribers();
    const subs = subscribers[this.name];

    // Check if the channel is already registered
    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i];
      if (channel.isEqual(sub.id)) {
        // Unsubscribe
        sub.gameSubs = sub.gameSubs.filter((gameName: string) => gameName !== game.name);

        // Remove unneccessary entries
        if (sub.gameSubs.length === 0 && !sub.prefix) {
          this.logDebug('Removing unnecessary channel entry...');
          subs.splice(i, 1);
        } else {
          subs[i] = sub;
        }

        // Save the changes
        subscribers[this.name] = subs;
        setSubscribers(subscribers);
        return true;
      }
    }
    return false;
  }

  /** Gets a BotChannel by its ID.
   *
   * @param id - The ID of the channel.
   * @returns The BotChannel with the specified ID.
   */
  public getChannelByID(id: string): BotChannel {
    const channels = getSubscribers()[this.name];
    const channel = new BotChannel(id, this);

    // Check if the channel is already registered
    for (const sub of channels) {
      if (channel.isEqual(sub.id)) {
        // Update properties
        channel.gameSubs = sub.gameSubs;
        channel.prefix = sub.prefix;
        break;
      }
    }

    return channel;
  }

  /** Sends a message to a channel.
   *
   * @param  {BotChannel} channel - The channel to message.
   * @param  {string|BotNotification} message - The message to send to the channel.
   * @returns void
   */
  public abstract async sendMessage(channel: BotChannel, message: string | BotNotification): Promise<boolean>;

  /** Sends a message to all subscribers of a game.
   *
   * @param  {Game} game - The game to notify the subscribers of.
   * @param  {string|BotNotification} message - The message to send to the subscribers.
   * @returns void
   */
  public sendMessageToGameSubs(game: Game, message: string | BotNotification): void {
    const subscribers = getSubscribers()[this.name];

    if (subscribers) {
      for (const channel of subscribers) {
        if (channel.gameSubs && channel.gameSubs.includes(game.name)) {
          this.sendMessage(new BotChannel(channel.id, channel.gameSubs, channel.prefix), message);
        }
      }
    }
  }

  /** Sends a message to all subscribers.
   *
   * @param  {string|BotNotification} message - The message to send to the subscribers.
   * @returns void
   */
  public sendMessageToAllSubs(message: string | BotNotification): void {
    const subscribers = getSubscribers()[this.name];

    if (subscribers) {
      for (const channel of subscribers) {
        if (channel.gameSubs && channel.gameSubs.length !== 0) {
          this.sendMessage(new BotChannel(channel.id, channel.gameSubs, channel.prefix), message);
        }
      }
    }
  }

  /** Logs a debug message.
   *
   * @param  {string} msg - The message to debug-log.
   * @returns void
   */
  public logDebug(msg: string): void {
    botLogger.debug(msg, this.label);
  }

  /** Logs an info message.
   *
   * @param  {string} msg - The message to info-log.
   * @returns void
   */
  public logInfo(msg: string): void {
    botLogger.info(msg, this.label);
  }

  /** Logs a warning message.
   *
   * @param  {string} msg - The message to warn-log.
   * @returns void
   */
  public logWarn(msg: string): void {
    botLogger.warn(msg, this.label);
  }

  /** Logs an error message.
   *
   * @param  {string} msg - The message to error-log.
   * @returns void
   */
  public logError(msg: string): void {
    botLogger.error(msg, this.label);
  }
}

export { BotClient };
