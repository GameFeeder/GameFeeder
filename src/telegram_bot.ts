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
    if (typeof(message) === 'string') {
      this.bot.sendMessage(channel.id, message);
    } else {
      this.bot.sendMessage(channel.id, message.text);
    }
    return true;
  }
}

export { TelegramBot };
