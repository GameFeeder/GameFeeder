import TelegramAPI from 'node-telegram-bot-api';
import Queue from 'smart-request-balancer';
import { BotClient } from './bot';
import User, { UserRole } from '../user';
import Channel from '../channel';
import Command from '../commands/command';
import ConfigManager from '../managers/config_manager';
import Notification from '../notifications/notification';
import MDRegex from '../util/regex';
import { StrUtil, mapAsync } from '../util/util';
import Message from '../message';
import Permissions from '../permissions';
import Game from '../game';

// node-telegram-bot-api includes snake_case properties
/* eslint-disable @typescript-eslint/camelcase */

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
  private bot: TelegramAPI;
  private token: string;
  private queue: Queue;
  private ruleNames: { [m in MessageType]: { [c in ChatType]: string } };
  private channelAuthorID = '-322';

  constructor(prefix: string, token: string, autostart: boolean) {
    super('telegram', 'Telegram', prefix, autostart);

    // Set up the bot
    this.token = token;
    this.bot = new TelegramAPI(token, { polling: false });
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
    const telegramUser = await this.bot.getMe();
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
      const chat = await this.bot.getChat(channel.id);
      if (chat.all_members_are_administrators || chat.type === 'private') {
        return UserRole.ADMIN;
      }
      // Check if user is an admin on this channel
      const chatAdmins = (await this.bot.getChatAdministrators(channel.id)) || [];
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
    let hasAccess;
    let canWrite;
    let canEdit;
    let canPin;

    try {
      // Try to get chat
      const chat = await this.bot.getChat(channel.id).catch((error) => {
        if (error.code === 'ETELEGRAM') {
          const response = error.response.body;
          const errorCode = response.error_code;
          switch (errorCode) {
            case 403: // Bot is not a member of the channel chat
              return undefined;
            default:
              throw error;
          }
        }
        this.logger.error(
          `Failed to get chat to check permissions on channel ${channel.label}:\n${error}`,
        );
        throw error;
      });
      // Check for expected chat errors
      if (!chat) {
        return new Permissions(false, false, false, false);
      }
      // Try to get chat member
      const chatMember = await this.bot.getChatMember(channel.id, user.id).catch((error) => {
        this.logger.error(`Failed to get chat member on channel ${channel.label}:\n${error}`);
        throw error;
      });
      // Check for expected chat member errors
      if (!chatMember) {
        return new Permissions(false, false, false, false);
      }

      hasAccess = !(chatMember.status === 'left' || chatMember.status === 'kicked');
      canWrite =
        hasAccess &&
        (chat.type === 'channel'
          ? // In channels the user must be an admin to write and have posting permissions
            chatMember.status === 'administrator' && chatMember.can_post_messages
          : // If the user is restricted, check permissions, else he can send messages
          chatMember.status === 'restricted'
          ? chatMember.can_send_messages
          : true);
      // If the user is an admin, check permissions, else he cannot edit
      canEdit =
        hasAccess && (chatMember.status === 'administrator' ? chatMember.can_edit_messages : false);
      canPin =
        hasAccess &&
        // Groups and supergroups only
        (chat.type === 'group' || chat.type === 'supergroup'
          ? // Check if the permission is restricted
            chatMember.status === 'restricted' || chatMember.status === 'administrator'
            ? chatMember.can_pin_messages
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
      return (await this.bot.getChatMembersCount(channel.id)) - 1;
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

    const userCounts = await mapAsync(channels, async (botChannel) => botChannel.getUserCount());
    const userCount = userCounts.reduce((prevValue, curValue) => prevValue + curValue, 0);
    return userCount;
  }

  public async getChannelCount(game?: Game): Promise<number> {
    const channels = this.getBotChannels();

    if (game) {
      channels.filter((channel) => channel.gameSubs.includes(game));
    }

    return channels.length;
  }

  public async getOwners(): Promise<User[]> {
    const ownerIds: string[] = ConfigManager.getBotConfig().telegram.owners || [];
    return ownerIds.map((id) => new User(this, id));
  }

  public registerCommand(command: Command): void {
    this.bot.on('message', async (msg: TelegramAPI.Message) => this.onMessage(msg, command));
    this.bot.on('channel_post', async (msg: TelegramAPI.Message) => this.onMessage(msg, command));
  }

  /** Executes the given command if the message matches the regex. */
  private async onMessage(msg: TelegramAPI.Message, command: Command): Promise<void> {
    const channel = this.getChannelByID(msg.chat.id.toString());
    try {
      // Re-enable the channel if disabled, since it is now active
      channel.disabled = false;
      // Channel messages don't have an author, so we have to work around that
      const userID = msg.from ? msg.from.id.toString() : this.channelAuthorID;
      // FIX: Properly identify the user key
      const user = new User(this, userID);
      const content = msg.text;
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
      this.logger.error(
        `Failed to execute command ${command.name} on channel ${channel.label}:\n${error}`,
      );
    }
  }

  public async start(): Promise<boolean> {
    try {
      if (this.token) {
        await this.bot.startPolling({ restart: true });
        this.isRunning = true;
        // Handle being removed from chats (except channels apparently)
        this.bot.on('left_chat_member', async (message) => {
          const leftMember = message.left_chat_member;
          const telegramUser = await this.bot.getMe();
          const userID = telegramUser.id;

          if (!leftMember || leftMember.id !== userID) {
            // It's not the bot
            return;
          }

          const channels = this.getBotChannels();
          const channelID = message.chat.id.toString();
          // Search for the channel
          const channel = channels.find((ch) => channelID === ch.id);
          if (channel) {
            await this.onRemoved(channel);
          }
        });

        // Initialize user name and user tag
        try {
          const botUser = await this.bot.getMe();
          this.userName = botUser.username;
          this.userTag = `@${this.userName}`;
        } catch (error) {
          this.logger.error(`Failed to get user name and user tag:\n${error}`);
        }

        return true;
      }
    } catch (error) {
      this.logger.error(`Failed to start bot:\n${error}`);
    }
    return false;
  }

  public stop(): void {
    this.bot.stopPolling();
    this.isRunning = false;
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
      const chat = await this.bot.getChat(channel.id);
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
    } catch (err) {
      this.logger.error(
        `Failed to add message for channel ${channel.label} in the queue, error: ${err}. \
        This is most likely because the bot has been blocked, disabling subscriber.`,
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

          if (message.author.text) {
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

      options = {
        disable_web_page_preview: !templateFound,
        parse_mode: 'Markdown',
      };
    }
    // Send the message
    try {
      await this.bot.sendMessage(channel.id, text, options);
    } catch (error) {
      // Log the appropriate error
      this.handleNotificationError(error, channel);
      if (retryAttempt <= MAX_SEND_MESSAGE_RETRIES) {
        this.logger.info(
          `This was attempt ${retryAttempt} of ${MAX_SEND_MESSAGE_RETRIES} for channel ${channel.label} `,
        );
        this.sendMessage(channel, messageText, retryAttempt + 1);
        return false;
      }

      // Disable the channel that failed.
      this.logger.warn(
        `Max retries reached; Disabling failed channel ${channel.label} to avoid future errors until active again.`,
      );
      channel.disabled = true;
      return false;
    }
    return true;
  }

  // TODO: Properly type the error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleNotificationError(error: any, channel: Channel) {
    if (error.code === 'ETELEGRAM') {
      const response = error.response.body;
      const errorCode = response.error_code;
      switch (errorCode) {
        // Chat not found
        case 400:
          this.logger.warn(
            `Failed to send notification to channel ${channel.label}, error code 400.`,
          );
          // this.removeData(channel);
          break;
        // Bot is not a member of the channel chat or blocked by user
        case 403:
          this.logger.warn(
            `Failed to send notification to channel ${channel.label}, error code 403.`,
          );
          // this.removeData(channel);
          break;
        default:
          this.logger.error(
            `Failed to send notification to channel ${channel.label}, error code ${errorCode}:\n${error}`,
          );
      }
    } else {
      this.logger.error(`Failed to send message to channel ${channel.label}:\n${error}`);
    }
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
