import TelegramAPI from 'node-telegram-bot-api';
import { BotClient } from './bot';
import { BotChannel } from './channel';
import { BotNotification } from './notification';

class TelegramBot extends BotClient {
  private bot: TelegramAPI;
  private token: string;

  constructor(prefix: string, token: string) {
    super('telegram', 'Telegram', prefix);

    // Set up the bot
    this.token = token;
    this.bot = new TelegramAPI(token, { polling: false });
  }

  public registerCommand(reg: RegExp, callback: (channel: BotChannel, match: RegExpExecArray) => void): void {
    this.bot.onText(reg, (msg: TelegramAPI.Message, match: RegExpExecArray) => {
      callback(new BotChannel(msg.chat.id.toString()), match);
    });
  }
  public async start(): Promise<boolean> {
    if (this.token) {
      this.bot.startPolling({ restart: true });
      return true;
    } else {
      return false;
    }
  }
  public stop(): void {
    this.bot.stopPolling();
  }
  public sendMessageToChannel(channel: BotChannel, message: string | BotNotification): boolean {
    if (typeof (message) === 'string') {
      message = this.msgFromMarkdown(message);
      this.bot.sendMessage(channel.id, message, { parse_mode: 'Markdown' });
    } else {
      message.text = this.msgFromMarkdown(message.text);
      this.bot.sendMessage(channel.id, message.text, { parse_mode: 'Markdown' });
    }
    return true;
  }

  public msgFromMarkdown(markdown: string): string {
    // Bold
    markdown = markdown.replace(/\*\*(.+)\*\*/g, '*$1*');

    // Linewise formatting
    const lineArray = markdown.split('\n');
    for (let i = 0; i < lineArray.length; i++) {
      // Lists
      lineArray[i] = lineArray[i].replace(/^\s*\*\s*/, '- ');
    }

    let newMarkdown = '';
    for (const line of lineArray) {
      newMarkdown += line;
    }

    return newMarkdown;
  }
}

export { TelegramBot };
