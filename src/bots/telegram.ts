import { Context, Telegraf } from 'telegraf';
import Queue from 'smart-request-balancer';
import PubSub from 'pubsub-js';
import { ExtraEditMessage, ParseMode } from 'telegraf/typings/telegram-types';
import { BotClient } from './bot';
import User, { UserRole } from '../user';
import Channel from '../channel';
import Command from '../commands/command';
import ConfigManager from '../managers/config_manager';
import Notification from '../notifications/notification';
import MDRegex from '../util/regex';
import { mapAsync } from '../util/array_util';
import { assertIsDefined, StrUtil } from '../util/util';
import Message from '../message';
import Permissions from '../permissions';
import Game from '../game';
import Updater from '../updater';
import { EVERYONE_TOPIC } from '../commands/commands';

enum MessageType {
  notification = 'notification',
  command = 'command',
}
enum ChatType {
  private = 'private',
  group = 'group',
}

interface TelegramError {
  code?: number;
  response: {
    ok: boolean;
    error_code: number;
    description: string;
  };
  description?: string;
  parameters?: {
    migrate_to_chat_id?: number;
    retry_after?: number;
  };
  on?: {
    method: string;
    payload: {
      chat_id: number;
      text: string;
      parse_mode: ParseMode;
    };
  };
}

const MAX_SEND_MESSAGE_RETRIES = 5;

export default class TelegramBot extends BotClient {
  private static standardBot: TelegramBot;
  private bot: Telegraf<Context>;
  private queue: Queue;
  private ruleNames: { [m in MessageType]: { [c in ChatType]: string } };
  private channelAuthorID = '-322';
  private updaterSubscription = '';
  private everyoneSubscription = '';

  constructor(prefix: string, private token: string, autostart: boolean) {
    super('telegram', 'Telegram', prefix, autostart);

    // Set up the bot
    this.bot = new Telegraf(token);
    this.bot.catch((err: TelegramError, ctx: Context) => {
      this.logger.error(`Encountered an error for ${ctx.updateType}: ${err}`);
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

  private setupUpdaterSubscription() {
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

  private setupEveryoneSubscription() {
    if (!this.everyoneSubscription) {
      this.everyoneSubscription = PubSub.subscribe(
        EVERYONE_TOPIC,
        (topic: string, message: string) => {
          this.sendMessageToAllSubs(message);
        },
      );
    }
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
      return '?';
    }
    return this.userName;
  }

  public getUserTag(): string {
    if (!this.enabled || !this.userTag) {
      return '?';
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
      // Check if user is owner
      const ownerIds = (await this.getOwners()).map((owner) => owner.id);
      if (ownerIds.includes(user.id)) {
        return UserRole.OWNER;
      }
      // Check if user has default admin rights
      const chat = await this.bot.telegram.getChat(channel.id);
      if (chat.all_members_are_administrators || chat.type === 'private') {
        return UserRole.ADMIN;
      }
      // Check if user is an admin on this channel
      const chatAdmins = (await this.bot.telegram.getChatAdministrators(channel.id)) || [];
      const adminIds = chatAdmins.map((admin) => admin.user.id.toString());
      if (adminIds.includes(user.id)) {
        return UserRole.ADMIN;
      }
    } catch (error) {
      this.logger.error(`Failed to get chat admins on channel ${channel.label}:\n${error}`);
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
      const chatMember = await this.bot.telegram.getChatMember(channel.id, parseInt(user.id, 10));
      // Check for expected chat member errors
      assertIsDefined(chatMember, 'ChatMember not defined in getUserPermissions()');

      // Chat type
      const isChannel = chat.type === 'channel';
      const isGroup = chat.type === 'group';
      const isSuperGroup = chat.type === 'supergroup';

      // Member status
      const isAdmin = chatMember.status === 'administrator';
      const isRestricted = chatMember.status === 'restricted';
      const hasLeft = chatMember.status === 'left';
      const isKicked = chatMember.status === 'kicked';

      // Permissions
      const canPostMsg = chatMember.can_post_messages ?? false;
      const canSendMsg = chatMember.can_send_messages ?? false;
      const canEditMsg = chatMember.can_edit_messages ?? false;
      const canPinMsg = chatMember.can_pin_messages ?? false;

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
      this.logger.error(
        `Failed to get user permissions due to unexpected error on channel ${channel.label}:\n${error}`,
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
      this.logger.error(`Failed to get chat member count for channel ${channel.label}:\n${error}`);
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
    assertIsDefined(ctx.message, 'Messsage is not defined onMessage');
    const channel = this.getChannelByID(ctx.chat.id.toString());
    try {
      // Re-enable the channel if disabled, since it is now active
      channel.disabled = false;
      // Channel messages don't have an author, so we have to work around that
      const userID = ctx.message.from?.id?.toString() ?? this.channelAuthorID;
      const user = new User(this, userID);
      const content = ctx.message.text ?? '';
      // Convert from Unix time to date
      const timeNumber = Math.min(Date.now(), ctx.message.date * 1000 + 500);
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
      this.logger.error(
        `Failed to execute command ${command.name} on channel ${channel.label}:\n${error}`,
      );
    }
  }

  public async start(): Promise<boolean> {
    // Startup check
    if (!this.enabled) {
      this.logger.info('Autostart disabled.');
      return false;
    }
    assertIsDefined(this.token, `Token is undefined`);
    const startTime = Date.now();

    // Set up the pubsub subscriptions
    this.setupUpdaterSubscription();
    this.setupEveryoneSubscription();

    // Add handlers
    this.addChatRemovalHandler();

    // Start the bot
    await this.bot.launch();
    this.isRunning = true;

    // Handle being removed from chats (except channels apparently)
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

    // Initialize user name and user tag
    try {
      const botUser = await this.bot.telegram.getMe();
      this.userName = botUser.username ?? '';
      this.userTag = `@${this.userName}`;
    } catch (error) {
      this.logger.error(`Failed to get user name and user tag:\n${error}`);
    }
    const time = Date.now() - startTime;
    this.logger.info(`Started bot as @${this.getUserName()} in ${time} ms.`);
    return true;
  }

  public stop(): void {
    this.bot.stop();
    this.isRunning = false;
    // Clean up subscriptions
    PubSub.unsubscribe(this.updaterSubscription);
    this.updaterSubscription = '';
    PubSub.unsubscribe(this.everyoneSubscription);
    this.everyoneSubscription = '';
    this.logger.info(`Stopped bot.`);
  }

  public async sendMessage(
    channel: Channel,
    messageText: string | Notification,
    retryAttempt = 0,
  ): Promise<boolean> {
    try {
      this.logger.info(`START: SendMessage to ${channel.label}`);
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
      const queueResponse = await this.queue.request(
        () => this.sendMessageInstantly(channel, messageText, retryAttempt),
        channel.id,
        rule,
      );
      // this.sendMessageInstantly(channel, messageText, retryAttempt);
      // this.logger.info(`END: SendMessage to ${channel.label}, message:${messageText}`);
      this.logger.info(
        `END: SendMessage to ${channel.label} with ${queueResponse}, isoverheated: ${this.queue.isOverheated}, length: ${this.queue.totalLength}`,
      );
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to add message for channel ${channel.label} in the queue. \
        \n - Error: ${err}. \
        \n - This is most likely because the bot has been blocked, disabling subscriber.`,
      );
      channel.disabled = true;
      return false;
    }
  }

  private async sendMessageInstantly(
    channel: Channel,
    messageText: string | Notification,
    retryAttempt = 0,
  ): Promise<boolean> {
    this.logger.info(`START: SendMessageInstantly to ${channel.label}`);
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
    let options: ExtraEditMessage = {};
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
      options = {
        disable_web_page_preview: !templateFound,
        parse_mode: 'Markdown',
      };
    }
    // Send the message
    try {
      await this.bot.telegram.sendMessage(channel.id, text, options);
    } catch (error) {
      // Log the appropriate error
      this.handleNotificationError(error, channel);
      if (retryAttempt <= MAX_SEND_MESSAGE_RETRIES) {
        this.logger.warn(
          `This was attempt ${retryAttempt} of ${MAX_SEND_MESSAGE_RETRIES} for channel ${channel.label} `,
        );
        this.sendMessage(channel, messageText, retryAttempt + 1);
        return false;
      }

      // Disable the channel that failed.
      this.logger.warn(
        `Max retries reached; Disabling failed channel ${channel.label} to avoid future errors until active again.`,
      );
      // channel.disabled = true;
      return false;
    }
    return true;
  }

  private handleNotificationError(error: TelegramError, channel: Channel) {
    const errorCode = error.response.error_code;
    this.logger.error(
      `Failed to send notification to channel ${channel.label}, error code ${errorCode}:\n${error}`,
    );
    // TODO: conditions
    // if (conditions) {
    //   this.logger.warn(`Unable to send notification to channel ${channel.label}, deleting data...`);
    //   this.removeData(channel);
    // }
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
