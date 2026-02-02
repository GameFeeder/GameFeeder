import Queue from 'smart-request-balancer';
import { Context, Telegraf, TelegramError } from 'telegraf';
import Channel from '../channel.js';
import Command from '../commands/command.js';
import Game from '../game.js';
import ConfigManager from '../managers/config_manager.js';
import Message from '../message.js';
import Notification from '../notifications/notification.js';
import Permissions from '../permissions.js';
import User, { UserRole } from '../user.js';
import { mapAsync } from '../util/array_util.js';
import MDRegex from '../util/regex.js';
import rollbar_client from '../util/rollbar_client.js';
import { assertIsDefined, StrUtil } from '../util/util.js';
import { BotClient } from './bot.js';

enum MessageType {
  notification = 'notification',
  command = 'command',
}
enum ChatType {
  private = 'private',
  group = 'group',
}

const MAX_SEND_MESSAGE_RETRIES = 5;

export default class TelegramBot extends BotClient {
  private static standardBot: TelegramBot;
  private bot: Telegraf<Context>;
  private queue: Queue;
  private ruleNames: { [m in MessageType]: { [c in ChatType]: string } };
  private channelAuthorID = '-322';

  constructor(
    prefix: string,
    private token: string,
    autostart: boolean,
  ) {
    super('telegram', 'Telegram', prefix, autostart);

    // Set up the bot
    this.bot = new Telegraf(token);
    this.bot.catch((err, ctx) => {
      rollbar_client.reportCaughtError(
        `Encountered an error for ${ctx.updateType}`,
        err,
        this.logger,
      );
    });
    this.queue = new Queue({
      rules: {
        notificationPrivate: {
          // Rule for sending notification messages to individuals
          rate: 1, // one message
          limit: 1, // per second
          priority: 2,
        },
        notificationGroup: {
          // Rule for sending notification messages to groups
          rate: 20, // 20 messages
          limit: 60, // per minute,
          priority: 2,
        },
        commandPrivate: {
          // Rule for replying to individual chat commands
          rate: 1, // one message
          limit: 1, // per second
          priority: 1,
        },
        commandGroup: {
          // Rule for replying to group chat commands
          rate: 20, // 20 messages
          limit: 60, // per minute,
          priority: 1,
        },
      },
    });
    this.ruleNames = {
      notification: {
        private: 'notificationPrivate',
        group: 'notificationGroup',
      },
      command: {
        private: 'commandPrivate',
        group: 'commandGroup',
      },
    };
  }

  public static getBot(): TelegramBot {
    if (this.standardBot) {
      return this.standardBot;
    }

    // Telegram Bot
    const {
      prefix: telegramPrefix,
      token: telegramToken,
      enabled: telegramAutostart,
    } = ConfigManager.getBotConfig().telegram;

    this.standardBot = new TelegramBot(telegramPrefix, telegramToken, telegramAutostart);
    return this.standardBot;
  }

  public getUserName(): string {
    if (!this.enabled || !this.userName) {
      return 'Telegram bot user name not set';
    }
    return this.userName;
  }

  public getUserTag(): string {
    if (!this.enabled || !this.userTag) {
      return 'Telegram bot user tag not set';
    }
    return this.userTag;
  }

  public async getUser(): Promise<User> {
    const telegramUser = await this.bot.telegram.getMe();
    const userID = telegramUser.id.toString();
    return new User(this, userID);
  }

  public async getUserRole(user: User, channel: Channel): Promise<UserRole> {
    try {
      // Channel messages don't have an author, we assigned the user id channelAuthorID
      // A bit hacky, but should work for now
      if (user.id === this.channelAuthorID) {
        // If you can write in a channel, you have an admin role
        return UserRole.ADMIN;
      }

      // Check if user is a GameFeeder owner
      const ownerIds = await this.getOwners();
      if (ownerIds.map((owner) => owner.id).includes(user.id)) {
        return UserRole.OWNER;
      }

      const chat = await this.bot.telegram.getChat(channel.id);
      if (chat.type === 'private') {
        return UserRole.ADMIN;
      }

      const adminIds = await this.bot.telegram.getChatAdministrators(channel.id);
      if (adminIds.map((admin) => admin.user.id.toString()).includes(user.id)) {
        return UserRole.ADMIN;
      }
    } catch (error) {
      rollbar_client.reportCaughtError(
        `Failed to get chat admins on channel ${channel.label}`,
        error,
        this.logger,
      );
    }
    // the user is just a regular user
    return UserRole.USER;
  }

  public async getUserPermissions(user: User, channel: Channel): Promise<Permissions> {
    // Default values if the permissions can't be checked
    let hasAccess = false;
    let canWrite = false;
    let canEdit = false;
    let canPin = false;

    try {
      // Try to get chat
      const chat = await this.bot.telegram.getChat(channel.id);
      // Check for expected chat errors
      assertIsDefined(chat, 'Chat not defined in getUserPermissions()');
      // Try to get chat member
      if (user.id === this.channelAuthorID) {
        return new Permissions(true, true, true, true);
      }
      const chatMember = await this.bot.telegram.getChatMember(channel.id, parseInt(user.id, 10));

      // Check for expected chat member errors
      assertIsDefined(chatMember, 'ChatMember not defined in getUserPermissions()');

      // Chat type
      const isChannel = chat.type === 'channel';
      const isGroup = chat.type === 'group';
      const isSuperGroup = chat.type === 'supergroup';
      const isPrivate = chat.type === 'private';

      // Member status
      const isCreator = chatMember.status === 'creator';
      const isAdmin = chatMember.status === 'administrator';
      const isRestricted = chatMember.status === 'restricted';
      const hasLeft = chatMember.status === 'left';
      const isKicked = chatMember.status === 'kicked';
      const isMember = chatMember.status === 'member';

      // Permissions
      const canPostMsg =
        (isCreator || (isAdmin && chatMember.can_post_messages) || isPrivate) ?? false;
      const canSendMsg =
        isCreator ||
        (isRestricted && chatMember.can_send_messages) ||
        isMember ||
        isAdmin ||
        isPrivate;
      const canEditMsg =
        (isCreator || (isAdmin && chatMember.can_edit_messages) || isPrivate) ?? false;
      const canPinMsg =
        (isCreator || ((isAdmin || isRestricted) && chatMember.can_pin_messages) || isPrivate) ??
        false;

      hasAccess = !(hasLeft || isKicked);
      canWrite =
        hasAccess &&
        (isChannel
          ? // In channels the user must be an admin to write and have posting permissions
            isAdmin && canPostMsg
          : // If the user is restricted, check permissions, else he can send messages
            isRestricted
            ? canSendMsg
            : true);
      // If the user is an admin, check permissions, else he cannot edit
      canEdit = hasAccess && (isAdmin ? canEditMsg : false);
      canPin =
        hasAccess &&
        // Groups and supergroups only
        (isGroup || isSuperGroup
          ? // Check if the permission is restricted
            isRestricted || isAdmin
            ? canPinMsg
            : true
          : false);
    } catch (error) {
      rollbar_client.reportCaughtError(
        `Failed to get user permissions due to unexpected error on channel ${channel.label}`,
        error,
        this.logger,
      );
      throw error;
    }

    const permissions = new Permissions(hasAccess, canWrite, canEdit, canPin);
    return permissions;
  }

  public async getChannelUserCount(channel: Channel): Promise<number> {
    // Get the count and subscract the bot itself
    try {
      return (await this.bot.telegram.getChatMembersCount(channel.id)) - 1;
    } catch (error) {
      rollbar_client.reportCaughtError(
        `Failed to get chat member count for channel ${channel.label}`,
        error,
        this.logger,
      );
      return 0;
    }
  }

  public async getUserCount(game?: Game): Promise<number> {
    const channels = this.getBotChannels();

    if (game) {
      channels.filter((channel) => channel.gameSubs.includes(game));
    }

    const userCounts = await mapAsync(channels, (botChannel) => botChannel.getUserCount());
    const userCount = userCounts.reduce((prevValue, curValue) => prevValue + curValue, 0);
    return userCount;
  }

  public getChannelCount(game?: Game): number {
    const channels = this.getBotChannels();

    if (game) {
      channels.filter((channel) => channel.gameSubs.includes(game));
    }

    return channels.length;
  }

  public getOwners(): User[] {
    const ownerIds: string[] = ConfigManager.getBotConfig().telegram.owners || [];
    return ownerIds.map((id) => new User(this, id));
  }

  public registerCommand(command: Command): void {
    this.bot.on('message', (ctx) => this.onMessage(ctx, command));
    this.bot.on('channel_post', (ctx) => this.onMessage(ctx, command));
    this.bot.on('channel_post', (ctx) => {
      if (ctx === undefined) {
        this.logger.debug('Undefined ctx');
        return;
      }
      if (ctx.channelPost === undefined) {
        this.logger.debug('Undefined message');
        return;
      }
      this.logger.debug(Object.keys(ctx.channelPost).join(', '));
      if ('text' in ctx.channelPost) {
        this.logger.debug(ctx.channelPost.text);
      }
    });
  }

  private addChatRemovalHandler(): void {
    this.bot.on('left_chat_member', async (ctx) => {
      assertIsDefined(ctx.message, 'Message is not defined on left_chat_member');
      const leftMember = ctx.message.left_chat_member;
      const telegramUser = await this.bot.telegram.getMe();
      const userID = telegramUser.id;

      if (!leftMember || leftMember.id !== userID) {
        // It's not the bot
        return;
      }

      const channels = this.getBotChannels();
      const channelID = ctx.message.chat.id.toString();
      // Search for the channel
      const channel = channels.find((ch) => channelID === ch.id);
      if (channel) {
        await this.onRemoved(channel);
      }
    });
  }

  /** Executes the given command if the message matches the regex. */
  private async onMessage(ctx: Context, command: Command): Promise<void> {
    assertIsDefined(ctx.chat, 'Chat is not defined onMessage');
    let msg;
    if (ctx.message !== undefined) {
      msg = ctx.message;
    } else if (ctx.channelPost !== undefined) {
      msg = ctx.channelPost;
    } else {
      throw new Error('Message and ChannelPost undefined');
    }
    const channel = this.getChannelByID(ctx.chat.id.toString());
    try {
      // Re-enable the channel if disabled, since it is now active
      channel.disabled = false;
      // Channel messages don't have an author, so we have to work around that
      const userID = msg.from?.id?.toString() ?? this.channelAuthorID;
      const user = new User(this, userID);
      let content = '';
      if ('text' in msg) {
        content = msg.text;
      }
      // Convert from Unix time to date
      const timeNumber = Math.min(Date.now(), msg.date * 1000 + 500);
      const timestamp = new Date(timeNumber);

      const reg = await command.getRegExp(channel);
      // Run regex on the msg
      const regMatch = reg.exec(content);
      const message = new Message(user, channel, content, timestamp);
      // If the regex matched, execute the handler function
      if (regMatch) {
        // Execute the command
        await command.execute(message, regMatch);
      }
    } catch (error) {
      rollbar_client.reportCaughtError(
        `Failed to execute command ${command.name} on channel ${channel.label}`,
        error,
        this.logger,
      );
    }
  }

  public async start(): Promise<boolean> {
    // Startup check
    if (!this.enabled) {
      throw new Error(`Bot ${this.name} is not enabled.`);
    }
    assertIsDefined(this.token, `Token is undefined`);

    // Add handlers
    this.logger.debug('Adding handlers');
    this.addChatRemovalHandler();

    // Set up the pubsub subscriptions
    this.logger.debug('Setup updater subscription');
    this.setupUpdaterSubscription();
    this.logger.debug('Setup everyone subscription');
    this.setupEveryoneSubscription();

    // Start the bot
    this.logger.debug('Launching');
    this.bot.launch();
    this.isRunning = true;

    // Initialize user name and user tag
    try {
      this.logger.debug('Getting user name and user tag');
      const botUser = await this.bot.telegram.getMe();
      this.userName = botUser.username ?? '';
      this.userTag = `@${this.userName}`;
    } catch (error) {
      rollbar_client.reportCaughtError(`Failed to get user name and user tag`, error, this.logger);
    }
    return this.isRunning;
  }

  public stop(): void {
    this.bot.stop();
    this.isRunning = false;
    this.cleanupSubscriptions();
    this.logger.info(`Stopped bot.`);
  }

  public async sendMessage(
    channel: Channel,
    messageText: string | Notification,
    retryAttempt = 0,
  ): Promise<boolean> {
    try {
      if (channel.disabled) {
        // TODO: Make this a debug log once verified to be working properly
        this.logger.info(`Not adding message to queue for disabled channel ${channel.label}`);
        return false;
      }
      const chat = await this.bot.telegram.getChat(channel.id);
      const messageType: MessageType =
        messageText instanceof Notification ? MessageType.notification : MessageType.command;
      const chatType: ChatType = chat.type === 'private' ? ChatType.private : ChatType.group;
      const rule = this.ruleNames[messageType][chatType];
      await this.queue.request(
        () => this.sendMessageInstantly(channel, messageText, retryAttempt),
        channel.id,
        rule,
      );
      return true;
    } catch (error) {
      rollbar_client.reportCaughtError(
        `Failed to add message for channel ${channel.label} in the queue`,
        error,
        this.logger,
      );
      return false;
    }
  }

  private async sendMessageInstantly(
    channel: Channel,
    messageText: string | Notification,
    retryAttempt = 0,
  ): Promise<boolean> {
    if (channel.disabled) {
      // TODO: Make this a debug log once verified to be working properly
      this.logger.info(`Skipping message for disabled channel ${channel.label}`);
      return false;
    }
    // TODO: Fix permission check
    // try {
    //   const permissions = await this.getUserPermissions(await this.getUser(), channel);
    //   // Check if the bot can write to this channel
    //   if (!permissions.canWrite) {
    //     if (this.removeData(channel)) {
    //       this.logger.warn(`Can't write to channel, removing all data.`);
    //     }
    //     return false;
    //   }
    // } catch (error) {
    //   this.logger.error(`Failed to get user permissions while sending to channel:\n${error}`);
    //   return false;
    // }

    // Set up the message
    const message = messageText;
    let text = '';
    // TODO: The options need to be of type ExtraReplyMessage
    let options = {};
    if (typeof message === 'string') {
      text = TelegramBot.msgFromMarkdown(message);
      options = { parse_mode: 'Markdown' };
    } else {
      const link = message.title.link;
      let templateFound = false;

      const templates = message.game.telegramIVTemplates;

      // Test for IV template matches
      for (const telegramIVtemplate of templates) {
        const templateLink = telegramIVtemplate.testUrl(link);
        if (templateLink) {
          templateFound = true;
          const titleText = `[${message.title.text}](${templateLink})`;

          if (message.author?.text) {
            const authorText = message.author.link
              ? `[${message.author.text}](${message.author.link})`
              : message.author.text;

            text = `New **${message.game.label}** update - ${authorText}:\n\n${titleText}`;
          } else {
            text = `New **${message.game.label}** update:\n\n${titleText}`;
          }
        }
        break;
      }

      // Check if an IV template matched
      if (!templateFound) {
        // Convert to normal text
        text = TelegramBot.msgFromMarkdown(message.toMDString());
      }

      // 2048 is the maximum notification length
      text = StrUtil.naturalLimit(text, 2048);

      // Snakecase used by Telegram API
      options = { parse_mode: 'Markdown' };
      // TODO: Add link_preview_options
    }
    // Send the message
    try {
      await this.bot.telegram.sendMessage(channel.id, text, options);
    } catch (error) {
      // Log the appropriate error
      const isRetriable = this.handleTelegramError(error as TelegramError, channel);
      if (isRetriable && retryAttempt <= MAX_SEND_MESSAGE_RETRIES) {
        this.logger.warn(
          `This was attempt ${retryAttempt} of ${MAX_SEND_MESSAGE_RETRIES} for channel ${channel.label}. Retrying... `,
        );
        this.sendMessage(channel, messageText, retryAttempt + 1);
        return false;
      }

      this.logger.warn(
        `Max retries reached for channel ${channel.label}, message will not be sent.`,
      );
      return false;
    }
    return true;
  }

  /**
   * Handles a Telegram error and returns whether the error is retriable.
   *
   * @private
   * @param {TelegramError} error
   * @param {Channel} channel
   * @return {*}  {boolean}
   * @memberof TelegramBot
   */
  private handleTelegramError(error: TelegramError, channel: Channel): boolean {
    const errorCode = error.response.error_code;
    this.logger.error(
      `Failed to send message to channel ${channel.label}, error code ${errorCode}:\n${error.description}`,
    );

    // Includes the following errors:
    // - Bot was blocked by the user
    // - Bot was kicked from the group
    // - User is deactivated
    if (errorCode == 403) {
      this.logger.warn(`Bot restricted from posting to ${channel.label}, disabling.`);
      channel.disabled = true;
      return false;
    }

    // When a group is updated to a supergroup the id changes
    if (
      errorCode == 400 &&
      error.description.includes('group chat was upgraded to a supergroup chat')
    ) {
      this.logger.warn(`Channel ${channel.label} has changed, disabling`);
      channel.disabled = true;
      return false;
    }
    return true;
  }

  public static msgFromMarkdown(text: string): string {
    if (!text) {
      return '';
    }
    let markdown = text;

    // Links
    markdown = MDRegex.replaceLinkImage(markdown, (_unusedText, label, linkUrl, imageUrl) => {
      let newLabel = label || 'Link';
      // Remove nested formatting
      newLabel = MDRegex.replaceItalic(newLabel, (__, italicText) => italicText);
      newLabel = MDRegex.replaceBold(newLabel, (__, boldText) => boldText);

      if (imageUrl) {
        return `[${newLabel}](${linkUrl}) ([image](${imageUrl}))`;
      }

      return `[${newLabel}](${linkUrl})`;
    });

    // Images
    markdown = MDRegex.replaceImageLink(markdown, (_unusedText, label, imageUrl, linkUrl) => {
      let newLabel = label || 'Image';
      // Remove nested formatting
      newLabel = MDRegex.replaceItalic(newLabel, (__, italicText) => italicText);
      newLabel = MDRegex.replaceBold(newLabel, (__, boldText) => boldText);

      if (linkUrl) {
        return `[${newLabel}](${imageUrl}) ([link](${linkUrl}))`;
      }

      return `[${newLabel}](${imageUrl})`;
    });

    // Italic
    markdown = MDRegex.replaceItalic(markdown, (_unusedText, italicText) => {
      return `_${italicText}_`;
    });

    // Bold
    markdown = MDRegex.replaceBold(markdown, (_unusedText, boldText) => {
      return `*${boldText}*`;
    });

    // Lists
    markdown = MDRegex.replaceList(markdown, (_unusedText, listElement) => {
      return `- ${listElement}`;
    });

    // Blockquotes
    markdown = MDRegex.replaceQuote(markdown, (_unusedText, quoteText) => {
      return `"${quoteText}"`;
    });

    // Headers
    markdown = MDRegex.replaceHeader(markdown, (_unusedText, headerText) => {
      return `\n\n*${headerText}*\n`;
    });

    // Separators
    markdown = MDRegex.replaceSeparator(markdown, () => {
      return `\n--\n`;
    });

    // Compress multiple linebreaks
    markdown = markdown.replace(/\s*\n\s*\n\s*/g, '\n\n');

    return markdown;
  }
}
