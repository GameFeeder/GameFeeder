import User, { UserRole } from '../user';
import Channel from '../channel';
import Command from '../commands/command';
import DataManager from '../managers/data_manager';
import Game from '../game';
import Notification from '../notifications/notification';
import Logger from '../logger';
import Permissions from '../permissions';
import { mapAsync } from '../util/util';

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
  public enabled: boolean;
  /** The logger used for this bot. */
  public logger: Logger;

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
    this.enabled = autostart;
    this.isRunning = false;

    this.logger = new Logger(label);
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

  /** Gets the role of a user on a given channel.
   *
   * @param user - The user to get the role of.
   * @param channel - The channel to get the role on.
   */
  public abstract async getUserRole(user: User, channel: Channel): Promise<UserRole>;

  /** Gets the permissions of a user on a given channel.
   *
   * @param user - The user to get the permissions of.
   * @param channel - The channel to get the permissions on.
   */
  public abstract async getUserPermissions(user: User, channel: Channel): Promise<Permissions>;

  /** Gets a list of the owners of the bot.
   *
   * @returns An array filled with the owner BotUsers of the bot.
   */
  public abstract async getOwners(): Promise<User[]>;

  /** Add a channel subscription to a game.
   *
   * @param  {Channel} channel - The channel to subscribe to the game.
   * @param  {Game} game - The game to subscribe to.
   * @returns True, if the subscription was successful, else false.
   */
  public async addSubscriber(channel: Channel, game: Game): Promise<boolean> {
    // Check if the bot can write to this channel
    const permissions = await this.getUserPermissions(await this.getUser(), channel);
    if (!permissions.canWrite) {
      if (this.removeData(channel)) {
        this.logger.warn(`Can't write to channel, removing all data.`);
      }
      return false;
    }
    const subscribers = DataManager.getSubscriberData();
    const channels = subscribers[this.name];

    // Check if the channel is already registered
    for (let i = 0; i < channels.length; i += 1) {
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
        DataManager.setSubscriberData(subscribers);
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
    DataManager.setSubscriberData(subscribers);
    return true;
  }

  /** Remove a channel subscription from a game.
   *
   * @param  {Channel} channel - The channel to unsubscribe from the game.
   * @param  {Game} game - The game to unsubscribe from.
   * @returns True, if the unsubscription was successful, else false.
   */
  public removeSubscriber(channel: Channel, game: Game): boolean {
    const subscribers = DataManager.getSubscriberData();
    const subs = subscribers[this.name];

    // Check if the channel is already registered
    const existingSubId = subs.findIndex((sub) => channel.isEqual(sub.id));
    if (existingSubId >= 0) {
      const sub = subs[existingSubId];
      // Unsubscribe
      sub.gameSubs = sub.gameSubs.filter((gameName: string) => gameName !== game.name);

      // Remove unnecessary entries
      if (sub.gameSubs.length === 0 && !sub.prefix) {
        this.logger.debug('Removing unnecessary channel entry...');
        subs.splice(existingSubId, 1);
      } else {
        subs[existingSubId] = sub;
      }

      // Save the changes
      subscribers[this.name] = subs;
      DataManager.setSubscriberData(subscribers);
      return true;
    }
    return false;
  }

  /** Removes the data of a channel.
   *
   * @param  {Channel} channel - The channel to remove the data from.
   */
  public removeData(channel: Channel): boolean {
    const subscribers = DataManager.getSubscriberData();
    const subs = subscribers[this.name];

    // Check if the channel has an entry
    const existingSubId = subs.findIndex((sub) => channel.isEqual(sub.id));
    if (existingSubId >= 0) {
      // Remove the channel
      subs.splice(existingSubId, 1);

      // Save the changes
      subscribers[this.name] = subs;
      DataManager.setSubscriberData(subscribers);

      return true;
    }
    return false;
  }

  /** Removes the data of all channels without write permissions. */
  public async removeChannelsWithoutWritePermissions() {
    const user = await this.getUser();
    const channels = this.getBotChannels();
    const permissions = await mapAsync(channels, (channel) =>
      this.getUserPermissions(user, channel),
    );
    // Iterate through all the channels
    let removeCount = 0;
    channels.forEach((channel, index) => {
      const channelPerms = permissions[index];
      if (!channelPerms.canWrite) {
        // The bot can not write to this channel, remove channel data
        if (this.removeData(channel)) {
          removeCount += 1;
        }
      }
    });
    if (removeCount > 0) {
      this.logger.warn(`Cleaning up ${removeCount} channel(s) without write access.`);
    }
  }

  /** Gets the bot user. */
  public abstract async getUser(): Promise<User>;

  /** Get the number of users in a given channel.
   *
   * @param channel - The channel to count the users in.
   * @returns The number of users in the given channel.
   */
  public abstract async getChannelUserCount(channel: Channel): Promise<number>;

  /** Gets the number of users for this bot. */
  public abstract async getUserCount(): Promise<number>;

  /** Gets the number of channels for this bot. */
  public abstract async getChannelCount(): Promise<number>;

  /** Get the channels subscribed on this bot client.
   *
   * @returns The channels subscribed to this bot client.
   */
  public getBotChannels(): Channel[] {
    return DataManager.getSubscriberData()[this.name].map(
      (jsonChannel: { id: string; gameSubs: string[]; prefix: string }) => {
        const subs = jsonChannel.gameSubs.map((gameName) => Game.getGameByName(gameName));
        return new Channel(jsonChannel.id, this, subs, jsonChannel.prefix);
      },
    );
  }

  /** Gets a BotChannel by its ID.
   *
   * @param id - The ID of the channel.
   * @returns The BotChannel with the specified ID.
   */
  public getChannelByID(id: string): Channel {
    const channels = DataManager.getSubscriberData()[this.name];
    const channel = new Channel(id, this);

    // Check if the channel is already registered
    for (const sub of channels) {
      if (channel.isEqual(sub.id)) {
        // Update properties
        channel.gameSubs = sub.gameSubs.map((gameName) => {
          return Game.getGameByName(gameName);
        });
        channel.prefix = sub.prefix;
        break;
      }
    }

    return channel;
  }

  /** Sends a message to a channel.
   *
   * @param  {Channel} channel - The channel to message.
   * @param  {string|Notification} message - The message to send to the channel.
   * @returns void
   */
  public abstract async sendMessage(
    channel: Channel,
    message: string | Notification,
  ): Promise<boolean>;

  /** Sends a message to all subscribers of a game.
   *
   * @param  {Game} game - The game to notify the subscribers of.
   * @param  {string|Notification} message - The message to send to the subscribers.
   * @returns void
   */
  public sendMessageToGameSubs(game: Game, message: string | Notification): void {
    const subscribers = DataManager.getSubscriberData()[this.name];

    if (subscribers) {
      for (const channel of subscribers) {
        if (channel.gameSubs && channel.gameSubs.includes(game.name)) {
          const gameSubs = channel.gameSubs.map((gameName) => Game.getGameByName(gameName));
          this.sendMessage(new Channel(channel.id, this, gameSubs, channel.prefix), message);
        }
      }
    }
  }

  /** Sends a message to all subscribers.
   *
   * @param  {string|Notification} message - The message to send to the subscribers.
   * @returns void
   */
  public sendMessageToAllSubs(message: string | Notification): void {
    const subscribers = DataManager.getSubscriberData()[this.name];

    if (subscribers) {
      for (const channel of subscribers) {
        if (channel.gameSubs && channel.gameSubs.length !== 0) {
          const gameSubs = channel.gameSubs.map((gameName) => Game.getGameByName(gameName));
          this.sendMessage(new Channel(channel.id, this, gameSubs, channel.prefix), message);
        }
      }
    }
  }

  /** Called when the bot is removed from the given channel. */
  public async onRemoved(channel: Channel) {
    if (this.removeData(channel)) {
      this.logger.debug(`Bot removed from channel, removing channel data.`);
    }
  }
}

export { BotClient };
