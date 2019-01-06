import DiscordAPI, { DMChannel, GroupDMChannel, TextBasedChannel, TextChannel } from 'discord.js';
import { BotClient } from './bot';
import { BotChannel } from './channel';
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

  public registerCommand(reg: RegExp, callback: (channel: BotChannel, match: RegExpMatchArray) => void): void {
    this.bot.on('message', (message) => {
      // Run regex on the msg
      const regMatch = reg.exec(message.toString());
      // If the regex matched, execute the handler function
      if (regMatch) {
        callback(new BotChannel(message.channel.id), regMatch);
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
  public sendMessageToChannel(channel: BotChannel, message: string | BotNotification): boolean {
    if (typeof message === 'string') {
      // Parse markdown
      message = this.msgFromMarkdown(message);
      const botChannels = this.bot.channels;
      const discordChannel = botChannels.get(channel.id);

      if (!discordChannel) {
        return false;
      }

      // Cast to the specific channel and send the message
      if (discordChannel instanceof DMChannel) {
        discordChannel.send(message);
        return true;
      } else if (discordChannel instanceof TextChannel) {
        discordChannel.send(message);
        return true;
      } else if (discordChannel instanceof GroupDMChannel) {
        discordChannel.send(message);
        return true;
      } else {
        return false;
      }
    } else {
      // TODO: Implement BotNotification handling
      return false;
    }
  }

  public msgFromMarkdown(markdown: string): string {
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

export { DiscordBot };
