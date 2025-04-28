import PubSub from 'pubsub-js';
import User, { UserRole } from '../user.js';
import Channel from '../channel.js';
import Command from '../commands/command.js';
import DataManager, { Subscriber } from '../managers/data_manager.js';
import Game from '../game.js';
import Notification from '../notifications/notification.js';
import Logger from '../logger.js';
import Permissions from '../permissions.js';
import { mapAsync } from '../util/array_util.js';
import Updater from '../updater.js';
import constants from '../util/constants.js';
import { assertIsDefined } from '../util/util.js';

export default abstract class BotClient {
  /** Indicator whether the bot is currently running. */
  public isRunning: boolean;
  /** The logger used for this bot. */
  public logger: Logger;
  /** The user tag of this bot. */
  public userTag?: string;
  /** The user name of this bot. */
  public userName?: string;

  protected updaterSubscription = '';
  protected everyoneSubscription = '';

  /** Creates a new BotClient.
   *
   * @param  {string} name - The internal name of the bot.
   * @param  {string} label - The human-readable label of the bot.
   * @param  {string} prefix - The prefix to use for commands.
   * @param {boolean} enabled - Indicates whether the bot should be started automatically.
   */
  constructor(
    public name: string,
    public label: string,
    public prefix: string,
    public enabled: boolean,
  ) {
    this.isRunning = false;
    this.logger = new Logger(label);
  }

  /** Gets the username of the bot.
   *
   * @return The username of the bot.
   */
  public abstract getUserName(): string;

  /** Gets the usertag of the bot. Used as prefix.
   *
   * @return The usertag of the bot.
   */
  public abstract getUserTag(): string;

  /** Registers a bot command.
   *
   * @param  {Command} command - The command to register.
   * @returns void
   */
  public abstract registerCommand(command: Command): void;

  protected setupUpdaterSubscription(): void {
    if (!this.updaterSubscription) {
      this.updaterSubscription = PubSub.subscribe(
        Updater.UPDATER_TOPIC,
        (topic: string, notification: Notification) => {
          assertIsDefined(notification.game, `Notification ${notification.title} has no game`);
          this.sendMessageToGameSubs(notification.game, notification);
        },
      );
    }
  }

  protected setupEveryoneSubscription(): void {
    if (!this.everyoneSubscription) {
      this.everyoneSubscription = PubSub.subscribe(
        constants.EVERYONE_TOPIC,
        (topic: string, message: string) => {
          this.sendMessageToAllSubs(message);
        },
      );
    }
  }

  protected cleanupSubscriptions(): void {
    PubSub.unsubscribe(this.updaterSubscription);
    this.updaterSubscription = '';
    PubSub.unsubscribe(this.everyoneSubscription);
    this.everyoneSubscription = '';
  }

  /** Start the bot.
   *
   * @returns True, if the start was successful, else false.
   */
  public abstract start(): Promise<boolean>;
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
  public abstract getUserRole(user: User, channel: Channel): Promise<UserRole>;

  /** Gets the permissions of a user on a given channel.
   *
   * @param user - The user to get the permissions of.
   * @param channel - The channel to get the permissions on.
   * @returns The permissions of the user or undefined, if no permissions could be retrieved.
   */
  public abstract getUserPermissions(
    user: User,
    channel: Channel,
  ): Promise<Permissions | undefined>;

  /** Gets a list of the owners of the bot.
   *
   * @returns An array filled with the owner BotUsers of the bot.
   */
  public abstract getOwners(): User[];

  /** Add a channel subscription to a game.
   *
   * @param  {Channel} channel - The channel to subscribe to the game.
   * @param  {Game} game - The game to subscribe to.
   * @returns True, if the subscription was successful, else false.
   */
  public async addSubscriber(channel: Channel, game: Game): Promise<boolean> {
    // Check if the bot can write to this channel
    const permissions = await this.getUserPermissions(await this.getUser(), channel);

    if (!permissions) {
      this.logger.error('Failed to get user permissions');
      return false;
    }

    if (!permissions.canWrite) {
      if (this.removeData(channel)) {
        this.logger.warn(`Can't write to channel ${channel.label}, removing all data.`);
      }
      return false;
    }

    const subscribers = DataManager.getSubscriberData();
    const channels = subscribers[this.name];

    // Check if the channel is already registered
    for (let i = 0; i < channels.length; i += 1) {
      const sub = channels[i];
      if (channel.isEqual(sub.id)) {
        // Check if the channel is already subscribed to the game's feed
        if (sub.gameSubs.find((gameName) => gameName === game.name)) {
          return false;
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
      prefix: undefined,
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

      // Check if the channel did not subscribe to the game's feed
      if (!sub.gameSubs.find((gameName) => gameName === game.name)) {
        return false;
      }

      // Unsubscribe
      sub.gameSubs = sub.gameSubs.filter((gameName: string) => gameName !== game.name);

      // Remove unnecessary entries
      if (sub.gameSubs.length === 0 && !sub.prefix && !sub.label) {
        this.logger.debug(`Removing unnecessary entry for channel ${channel.label}...`);
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
  public async removeChannelsWithoutWritePermissions(): Promise<void> {
    const user = await this.getUser();
    const channels = this.getBotChannels();
    const permissions = await mapAsync(channels, (channel) =>
      this.getUserPermissions(user, channel),
    );
    // Iterate through all the channels
    let removeCount = 0;
    channels.forEach((channel, index) => {
      const channelPerms = permissions[index];

      if (!channelPerms) {
        this.logger.error(
          `Failed to get user permissions while removing channels for channel ${channel.label}`,
        );
      } else if (!channelPerms.canWrite) {
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
  public abstract getUser(): User | Promise<User>;

  /** Get the number of users in a given channel.
   *
   * @param channel - The channel to count the users in.
   * @returns The number of users in the given channel.
   */
  public abstract getChannelUserCount(channel: Channel): Promise<number>;

  /** Gets the number of users for this bot. */
  public abstract getUserCount(game?: Game): Promise<number>;

  /** Gets the number of channels for this bot. */
  public abstract getChannelCount(game?: Game): number;

  /** Get the channels subscribed on this bot client.
   *
   * @returns The channels subscribed to this bot client.
   */
  public getBotChannels(): Channel[] {
    return DataManager.getSubscriberData()[this.name].map((jsonChannel: Subscriber) => {
      const subs = jsonChannel.gameSubs.map((gameName) => Game.getGameByName(gameName));
      return new Channel(
        jsonChannel.id,
        this,
        subs,
        jsonChannel.prefix,
        jsonChannel.label,
        jsonChannel.disabled,
      );
    });
  }

  /** Gets a BotChannel by its ID.
   *
   * @param id - The ID of the channel.
   * @returns The BotChannel with the specified ID.
   */
  public getChannelByID(id: string): Channel {
    const channels = DataManager.getSubscriberData()[this.name];

    let gameSubs: Game[] = [];
    let prefix: string | undefined;
    let label: string | undefined;
    let disabled: boolean | undefined;

    // Check if the channel is already registered
    for (const sub of channels) {
      if (String(id) === String(sub.id)) {
        // Update properties
        gameSubs = sub.gameSubs.map((gameName) => {
          return Game.getGameByName(gameName);
        });
        prefix = sub.prefix;
        label = sub.label;
        disabled = sub.disabled;
        break;
      }
    }

    return new Channel(id, this, gameSubs, prefix, label, disabled);
  }

  /** Sends a message to a channel.
   *
   * @param  {Channel} channel - The channel to message.
   * @param  {string|Notification} message - The message to send to the channel.
   * @returns void
   */
  public abstract sendMessage(channel: Channel, message: string | Notification): Promise<boolean>;

  /** Sends a message to all subscribers of a game.
   *
   * @param  {Game} game - The game to notify the subscribers of.
   * @param  {Notification} message - The message to send to the subscribers.
   * @returns void
   */
  public sendMessageToGameSubs(game: Game, message: Notification): void {
    const subscribers = DataManager.getSubscriberData()[this.name];

    if (!game) {
      this.logger.error(`Failed to send message to game subs:\nNo game specified!`);
      return;
    }

    if (subscribers) {
      for (const channelData of subscribers) {
        if (channelData.gameSubs?.includes(game.name)) {
          const channel = this.getChannelByID(channelData.id);
          this.sendMessage(channel, message);
        }
      }
    }
  }

  /** Sends a message to all subscribers.
   *
   * @param  {string|Notification} message - The message to send to the subscribers.
   * @returns void
   */
  public async sendMessageToAllSubs(message: string | Notification): Promise<void> {
    const subscribers = DataManager.getSubscriberData()[this.name];

    if (subscribers) {
      for (const channelData of subscribers) {
        if (channelData.gameSubs?.length !== 0) {
          const channel = this.getChannelByID(channelData.id);
          await this.sendMessage(channel, message);
        }
      }
    }
  }

  /** Called when the bot is removed from the given channel. */
  public onRemoved(channel: Channel): void {
    if (this.removeData(channel)) {
      this.logger.info(`Bot removed from channel, removing channel data.`);
    }
  }
}

export { BotClient };
