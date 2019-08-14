import TelegramAPI from 'node-telegram-bot-api';
import { BotClient } from './bot';
import BotUser, { UserPermission } from './bot_user';
import BotChannel from './channel';
import Command from './command';
import ConfigManager from './config_manager';
import BotNotification from './notification';

export default class TelegramBot extends BotClient {
  private static standardBot: TelegramBot;
  private bot: TelegramAPI;
  private token: string;

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
    this.bot.onText(/.*/, async (msg: TelegramAPI.Message) => {
      try {
        const channel = this.getChannelByID(msg.chat.id.toString());
        const reg = await command.getRegExp(channel);
        // Run regex on the msg
        const regMatch = reg.exec(msg.text);
        // If the regex matched, execute the handler function
        if (regMatch) {
          // Execute the command
          await command.execute(
            this,
            channel,
            // FIX: Properly identify the user key
            new BotUser(this, msg.from.id.toString()),
            regMatch,
          );
        }
      } catch (error) {
        this.logError(`Failed to get register command ${command}:\n${error}`);
      }
    });
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
      message = this.msgFromMarkdown(message);
      try {
        await this.bot.sendMessage(channel.id, message, { parse_mode: 'Markdown' });
      } catch (error) {
        this.logError(`Failed to send message to channel:\n${error}`);
      }
    } else {
      let text = this.msgFromMarkdown(message.toMDString());
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

  public msgFromMarkdown(markdownText: string): string {
    let markdown = markdownText;
    if (!markdown) {
      return '';
    }
    // Image Links
    markdown = markdown.replace(/\[\!\[\]\((.*)\)\]\((.*)\)/g, '[Image]($1) ([Link]($2))');
    markdown = markdown.replace(/\[\!\[(.*)\]\((.*)\)\]\((.*)\)/g, '[$1]($2) ([Link]($3))');
    markdown = markdown.replace(/\!\[\]\((.*)\)/g, '[Image]($1)');
    markdown = markdown.replace(/\!\[(.*)\]\((.*)\)/g, '[$1]($2)');
    // Italic
    markdown = markdown.replace(/\*(?!\*)(.+)(?!\*)\*/g, '_$1_');
    // Bold
    markdown = markdown.replace(/__(.+)__/g, '*$1*');
    markdown = markdown.replace(/\*\*(.+)\*\*/g, '*$1*');
    // Formatting with Links
    markdown = markdown.replace(/\*(.*)[ \t]*\[(.*)\]\((.*)\)[ \t]*(.*)\*/g, '*$1* [$2]($3) *$4*');
    markdown = markdown.replace(
      /__(.*)[ \t]*\[(.*)\]\((.*)\)[ \t]*(.*)__/g,
      '__$1__ [$2]($3) __$4__',
    );

    markdown = markdown.replace(/\[\*(.*)\*\]\((.*)\)/g, '[$1]($2)');
    markdown = markdown.replace(/\[__(.*)__\]\((.*)\)/g, '[$1]($2)');

    markdown = markdown.replace(/\*\[(.*)\]\((.*)\)\*/g, '[$1]($2)');
    markdown = markdown.replace(/__\[(.*)\]\((.*)\)__/g, '[$1]($2)');

    // Remove empty formatting rules
    markdown = markdown.replace(/\*\*/g, '');
    markdown = markdown.replace(/____/g, '');

    // Compress multiple linebreaks
    markdown = markdown.replace(/\s*\n\s*\n\s*/g, '\n\n');

    // Linewise formatting
    const lineArray = markdown.split('\n');
    for (let i = 0; i < lineArray.length; i++) {
      // H1-6
      lineArray[i] = lineArray[i].replace(/^\s*##?#?\s*(.*)/, '*$1*');
      // Lists
      lineArray[i] = lineArray[i].replace(/^\s*\*\s+/, '- ');
    }

    let newMarkdown = '';
    for (const line of lineArray) {
      newMarkdown += `${line}\n`;
    }

    return newMarkdown;
  }
}
