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
      this.bot.sendMessage(channel.id, message, { parse_mode: 'Markdown' });
    } else {
      const text = `${this.msgFromMarkdown(message.text)}\n[Link](${message.title.link})`;
      this.bot.sendMessage(channel.id, text, { parse_mode: 'Markdown' });
    }
    return true;
  }

  public msgFromMarkdown(markdown: string): string {
    // Italic
    markdown = markdown.replace(/\*(?!\*)(.+)(?!\*)\*/g, '_$1_');
    // Bold
    markdown = markdown.replace(/__(.+)__/g, '*$1*');
    markdown = markdown.replace(/\*\*(.+)\*\*/g, '*$1*');

    // Linewise formatting
    const lineArray = markdown.split('\n');
    for (let i = 0; i < lineArray.length; i++) {
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
