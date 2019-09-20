import TelegramAPI from 'node-telegram-bot-api';
import { BotClient } from './bot';
import BotUser, { UserPermission } from './bot_user';
import BotChannel from './channel';
import Command from './command';
import ConfigManager from './config_manager';
import BotNotification from './notification';
import MDRegex, { bold, seperator } from './regex';

export default class TelegramBot extends BotClient {
  private static standardBot: TelegramBot;
  private bot: TelegramAPI;
  private token: string;
  private channelAuthorID: string = '-322';

  constructor(prefix: string, token: string, autostart: boolean) {
    super('telegram', 'Telegram', prefix, autostart);

    // Set up the bot
    this.token = token;
    this.bot = new TelegramAPI(token, { polling: false });
  }

  public static getBot(): TelegramBot {
    if (this.standardBot) {
      return this.standardBot;
    }

    // Telegram Bot
    const {
      prefix: telegramPrefix,
      token: telegramToken,
      autostart: telegramAutostart,
    } = ConfigManager.getBotConfig().telegram;

    this.standardBot = new TelegramBot(telegramPrefix, telegramToken, telegramAutostart);
    return this.standardBot;
  }

  public async getUserName(): Promise<string> {
    try {
      const botUser = await this.bot.getMe();
      return botUser.username;
    } catch (error) {
      this.logError(`Failed to get user name:\n${error}`);
    }
  }

  public async getUserTag(): Promise<string> {
    try {
      const userName = await this.getUserName();
      return `@${userName}`;
    } catch (error) {
      this.logError(`Failed to get user tag:\n${error}`);
    }
  }

  public async getUserPermission(user: BotUser, channel: BotChannel): Promise<UserPermission> {
    try {
      // Channel messages don't have an author, we assigned the user id channelAuthorID
      // A bit hacky, but should work for now
      if (user.id === this.channelAuthorID) {
        // If you can write in a channel, you get admin permissions
        return UserPermission.ADMIN;
      }
      // Check if user is owner
      const ownerIds = (await this.getOwners()).map((owner) => owner.id);
      if (ownerIds.includes(user.id)) {
        return UserPermission.OWNER;
      }
      // Check if user has default admin rights
      const chat = await this.bot.getChat(channel.id);
      if (chat.all_members_are_administrators || chat.type === 'private') {
        return UserPermission.ADMIN;
      }
      // Check if user is an admin on this channel
      const chatAdmins = (await this.bot.getChatAdministrators(channel.id)) || [];
      const adminIds = chatAdmins.map((admin) => admin.user.id.toString());
      if (adminIds.includes(user.id)) {
        return UserPermission.ADMIN;
      }
    } catch (error) {
      this.logError(`Failed to get chat admins:\n${error}`);
    }
    // the user is just a regular user
    return UserPermission.USER;
  }

  public async getChannelUserCount(channel: BotChannel): Promise<number> {
    // Get the count and subscract the bot itself
    try {
      return (await this.bot.getChatMembersCount(channel.id)) - 1;
    } catch (error) {
      this.logError(`Failed to get chat member count for channel ${channel}:\n${error}`);
    }
  }

  public async getOwners(): Promise<BotUser[]> {
    const ownerIds: string[] = ConfigManager.getBotConfig().telegram.owners || [];
    return ownerIds.map((id) => new BotUser(this, id));
  }

  public registerCommand(command: Command): void {
    this.bot.on('message', async (msg: TelegramAPI.Message) => this.onMessage(msg, command));
    this.bot.on('channel_post', async (msg: TelegramAPI.Message) => this.onMessage(msg, command));
  }

  /** Executes the given command if the message matches the regex. */
  private async onMessage(msg: TelegramAPI.Message, command: Command): Promise<void> {
    try {
      const channel = this.getChannelByID(msg.chat.id.toString());
      const reg = await command.getRegExp(channel);
      // Run regex on the msg
      const regMatch = reg.exec(msg.text);
      // If the regex matched, execute the handler function
      if (regMatch) {
        // Channel messages don't have an author, so we have to work around that
        const userID = msg.from ? msg.from.id.toString() : this.channelAuthorID;
        // Execute the command
        await command.execute(
          this,
          channel,
          // FIX: Properly identify the user key
          new BotUser(this, userID),
          regMatch,
        );
      }
    } catch (error) {
      this.logError(`Failed to execute command ${command.label}:\n${error}`);
    }
  }

  public async start(): Promise<boolean> {
    try {
      if (this.token) {
        await this.bot.startPolling({ restart: true });
        this.isRunning = true;
        return true;
      }
    } catch (error) {
      this.logError(`Failed to start bot:\n${error}`);
    }
    return false;
  }

  public stop(): void {
    this.bot.stopPolling();
    this.isRunning = false;
  }

  public async sendMessage(
    channel: BotChannel,
    messageText: string | BotNotification,
  ): Promise<boolean> {
    let message = messageText;
    if (typeof message === 'string') {
      message = TelegramBot.msgFromMarkdown(message);
      try {
        await this.bot.sendMessage(channel.id, message, { parse_mode: 'Markdown' });
      } catch (error) {
        this.logError(`Failed to send message to channel:\n${error}`);
      }
    } else {
      let text = TelegramBot.msgFromMarkdown(message.toMDString());
      if (text.length > 2048) {
        text = text.substring(0, 2048);
      }
      try {
        await this.bot.sendMessage(channel.id, text, {
          disable_web_page_preview: true,
          parse_mode: 'Markdown',
        });
      } catch (error) {
        this.logError(`Failed to send notification to channel ${channel.id}:\n${error}`);
      }
    }
    return true;
  }

  public static msgFromMarkdown(text: string): string {
    if (!text) {
      return '';
    }
    let markdown = text;

    // Links
    markdown = MDRegex.replaceLinkImage(markdown, (_, label, linkUrl, imageUrl) => {
      let newLabel = label ? label : 'Link';
      // Remove nested formatting
      newLabel = MDRegex.replaceItalic(newLabel, (_, italicText) => italicText);
      newLabel = MDRegex.replaceBold(newLabel, (_, boldText) => boldText);

      if (imageUrl) {
        return `[${newLabel}](${linkUrl}) ([image](${imageUrl}))`;
      }

      return `[${newLabel}](${linkUrl})`;
    });

    // Images
    markdown = MDRegex.replaceImageLink(markdown, (_, label, imageUrl, linkUrl) => {
      let newLabel = label ? label : 'Image';
      // Remove nested formatting
      newLabel = MDRegex.replaceItalic(newLabel, (_, italicText) => italicText);
      newLabel = MDRegex.replaceBold(newLabel, (_, boldText) => boldText);

      if (linkUrl) {
        return `[${newLabel}](${imageUrl}) ([link](${linkUrl}))`;
      }

      return `[${newLabel}](${imageUrl})`;
    });

    // Italic
    markdown = MDRegex.replaceItalic(markdown, (_, italicText) => {
      return `_${italicText}_`;
    });

    // Bold
    markdown = MDRegex.replaceBold(markdown, (_, boldText) => {
      return `*${boldText}*`;
    });

    // Lists
    markdown = MDRegex.replaceList(markdown, (_, listElement) => {
      return `- ${listElement}`;
    });

    // Blockquotes
    markdown = MDRegex.replaceQuote(markdown, (_, quoteText) => {
      return `"${quoteText}"`;
    });

    // Headers
    markdown = MDRegex.replaceHeader(markdown, (_, headerText, level) => {
      return `\n*${headerText}*`;
    });

    // Seperators
    markdown = MDRegex.replaceSeperator(markdown, (_, seperator) => {
      return `\n--\n`;
    });

    // Compress multiple linebreaks
    markdown = markdown.replace(/\s*\n\s*\n\s*/g, '\n\n');

    return markdown;
  }
}
