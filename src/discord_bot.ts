import DiscordAPI from 'discord.js';
import { BotClient } from './bot';
import { DiscordChannel } from './discord_channel';
import { BotNotification } from './notification';

class DiscordBot extends BotClient {
  private bot: DiscordAPI.Client;
  private token: string;

  constructor(prefix: string, token: string) {
    super('discord', 'Discord', prefix);

    // Set up the bot
    this.token = token;
    this.bot = new DiscordAPI.Client();
  }

  public registerCommand(reg: RegExp, callback: (channel: any, match: RegExpMatchArray) => void): void {
    this.bot.on('message', (message) => {
      // Run regex on the msg
      const regMatch = reg.exec(message.toString());
      // If the regex matched, execute the handler function
      if (regMatch) {
        callback(new DiscordChannel(message.channel), regMatch);
      }
    });
  }
  public async start(): Promise<boolean> {
    if (this.token) {
      this.bot.login(this.token);
      return true;
    } else {
      return false;
    }
  }
  public stop(): void {
    this.bot.destroy();
  }
  public sendMessageToChannel(channel: any, message: string | BotNotification): void {
    this.bot.users.get(channel.id.toString()).send(message);
  }
}

export { DiscordBot };
