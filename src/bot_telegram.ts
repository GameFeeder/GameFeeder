import TelegramAPI from 'node-telegram-bot-api';
import { BotClient } from './bot';
import BotUser, { UserPermission } from './bot_user';
import BotChannel from './channel';
import Command from './command';
import { getBotConfig } from './data';
import BotNotification from './notification';

export default class TelegramBot extends BotClient {
  private bot: TelegramAPI;
  private token: string;

  constructor(prefix: string, token: string, autostart: boolean) {
    super('telegram', 'Telegram', prefix, autostart);

    // Set up the bot
    this.token = token;
    this.bot = new TelegramAPI(token, { polling: false });
  }

  public async getUserName(): Promise<string> {
    const botUser = await this.bot.getMe();
    return botUser.username;
  }

  public async getUserTag(): Promise<string> {
    const userName = await this.getUserName();
    return `@${userName}`;
  }

  public async getUserPermission(user: BotUser, channel: BotChannel): Promise<UserPermission> {
    // Check if user is owner
    const ownerIds = (await this.getOwners()).map((owner) => owner.id);
    if (ownerIds.includes(user.id)) {
      return UserPermission.OWNER;
    }
    // Check if user has default admin rights
    const chat = await this.bot.getChat(channel.id);
    if (chat.all_members_are_administrators || (chat.type === 'private')) {
      return UserPermission.ADMIN;
    }
    // Check if user is an admin on this channel
    const chatAdmins = await this.bot.getChatAdministrators(channel.id);
    const adminIds = chatAdmins.map((admin) => admin.user.id.toString());
    if (adminIds.includes(user.id)) {
      return UserPermission.ADMIN;
    }
    // the user is just a regular user
    return UserPermission.USER;
  }

  public async getChannelUserCount(channel: BotChannel): Promise<number> {
    // Get the count and subscract the bot itself
    return (await this.bot.getChatMembersCount(channel.id) - 1);
  }

  public async getOwners(): Promise<BotUser[]> {
    const ownerIds: string[] = getBotConfig().telegram.owners;
    return ownerIds.map((id) => new BotUser(this, id));
  }

  public registerCommand(command: Command): void {
    this.bot.onText(/.*/, async (msg: TelegramAPI.Message) => {
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
    });
  }
  public async start(): Promise<boolean> {
    if (this.token) {
      await this.bot.startPolling({ restart: true });
      this.isRunning = true;
      return true;
    } else {
      return false;
    }
  }
  public stop(): void {
    this.bot.stopPolling();
    this.isRunning = false;
  }
  public async sendMessage(channel: BotChannel, message: string | BotNotification): Promise<boolean> {
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
        await this.bot.sendMessage(channel.id, text, { parse_mode: 'Markdown', disable_web_page_preview: true });
      } catch (error) {
        this.logError(`Failed to send notification to channel:\n${error}`);
      }
    }
    return true;
  }

  public msgFromMarkdown(markdown: string): string {
    if (!markdown) {
      return '';
    }
    // Italic
    markdown = markdown.replace(/\*(?!\*)(.+)(?!\*)\*/g, '_$1_');
    // Bold
    markdown = markdown.replace(/__(.+)__/g, '*$1*');
    markdown = markdown.replace(/\*\*(.+)\*\*/g, '*$1*');

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
      newMarkdown += line + '\n';
    }

    return newMarkdown;
  }
}

// Telegram Bot
const { prefix: telegramPrefix, token: telegramToken, autostart: telegramAutostart } = getBotConfig().telegram;
const telegramBot = new TelegramBot(telegramPrefix, telegramToken, telegramAutostart);

export { TelegramBot, telegramBot };
