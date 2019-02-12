import TelegramAPI from 'node-telegram-bot-api';
import { BotClient } from './bot';
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

  public registerCommand(command: Command): void {
    const reg = command.getRegExp(this);
    this.bot.onText(reg, (msg: TelegramAPI.Message, match: RegExpExecArray) => {
      command.callback(this, new BotChannel(msg.chat.id.toString()), match);
    });
  }
  public async start(): Promise<boolean> {
    if (this.token) {
      this.bot.startPolling({ restart: true });
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
  public sendMessageToChannel(channel: BotChannel, message: string | BotNotification): boolean {
    if (typeof (message) === 'string') {
      message = this.msgFromMarkdown(message);
      try {
        this.bot.sendMessage(channel.id, message, { parse_mode: 'Markdown' });
      } catch (error) {
        this.logError(`Failed to send message to channel:\n${error}`);
      }
    } else {
      let text = this.msgFromMarkdown(message.toMDString());
      if (text.length > 2048) {
        text = text.substring(0, 2048);
      }
      try {
        this.bot.sendMessage(channel.id, text, { parse_mode: 'Markdown', disable_web_page_preview: true });
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
