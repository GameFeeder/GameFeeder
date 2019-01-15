import BotChannel from './channel';
import { getBotConfig, getSubscribers, setSubscribers } from './data';
import { Game } from './game';
import botLogger from './logger';
import BotNotification from './notification';

abstract class BotClient {
  /** The internal name of the bot. */
  public name: string;
  /** The human-readable label of the bot. */
  public label: string;
  /** The prefix to use for commands. */
  public prefix: string;
  /** Indicator if the bot is currently running or not. */
  public isRunning: boolean;

  /** Creates a new BotClient.
   *
   * @param  {string} name - The internal name of the bot.
   * @param  {string} label - The human-readable label of the bot.
   * @param  {string} prefix - The prefix to use for commands.
   */
  constructor(name: string, label: string, prefix: string) {
    this.name = name;
    this.label = label;
    this.prefix = prefix;
    this.isRunning = false;
  }

  /** Register a bot command.
   *
   * @param  {RegExp} reg - The regular expression triggering the command.
   * @param  {(channel:BotChannel,match:RegExpMatchArray)=>void} callback - The function handling the command.
   * @returns void
   */
  public abstract registerCommand(reg: RegExp, callback: (channel: BotChannel, match: RegExpMatchArray) => void): void;
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

  /** Add a channel supscription to a game.
   *
   * @param  {BotChannel} channel - The channel to subscribe to the game.
   * @param  {Game} game - The game to subscribe to.
   * @returns True, if the subscription was successful, else false.
   */
  public addSubscriber(channel: BotChannel, game: Game): boolean {
    const subscribers = getSubscribers();
    const gameSubs = subscribers[this.name][game.name];

    // Check if channel is already subscribed to this client
    for (const sub of gameSubs) {
      if (channel.isEqual(sub)) {
        return false;
      }
    }

    // Save changes
    gameSubs.push(channel.toJSON());
    subscribers[this.name][game.name] = gameSubs;
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
    const gameSubs: string[] = subscribers[this.name][game.name];

    // Check if channel is already subscribed to this client
    let hasSubbed = false;
    for (let i = 0; i < gameSubs.length; i++) {
      if (channel.isEqual(gameSubs[i])) {
        gameSubs.splice(i, 1);
        this.logDebug(`Index ${i}, Subs: ${gameSubs}`);
        hasSubbed = true;
        break;
      }
    }

    if (!hasSubbed) {
      return false;
    }

    // Save changes
    subscribers[this.name][game.name] = gameSubs;
    setSubscribers(subscribers);

    return true;
  }

  /** Sends a message to a channel.
   *
   * @param  {BotChannel} channel - The channel to message.
   * @param  {string|BotNotification} message - The message to send to the channel.
   * @returns void
   */
  public abstract sendMessageToChannel(channel: BotChannel, message: string | BotNotification): boolean;

  /** Sends a message to all subscribers of a game.
   *
   * @param  {Game} game - The game to notify the subscribers of.
   * @param  {string|BotNotification} message - The message to send to the subscribers.
   * @returns void
   */
  public sendMessageToGameSubs(game: Game, message: string | BotNotification): void {
    // TODO: Implement
  }

  /** Sends a message to all subscribers.
   *
   * @param  {string|BotNotification} message - The message to send to the subscribers.
   * @returns void
   */
  public sendMessageToAllSubs(message: string | BotNotification): void {
    // TODO: Implement
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
