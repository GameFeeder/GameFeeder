import DiscordAPI, { DMChannel, GroupDMChannel, TextBasedChannel, TextChannel } from 'discord.js';
import { BotClient } from './bot';
import { BotChannel } from './channel';
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

  public registerCommand(reg: RegExp, callback: (channel: BotChannel, match: RegExpMatchArray) => void): void {
    this.bot.on('message', (message) => {
      // Run regex on the msg
      const regMatch = reg.exec(message.toString());
      // If the regex matched, execute the handler function
      if (regMatch) {
        this.logDebug(`Channel ID: ${message.channel.id}`);
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
  public sendMessageToChannel(channel: BotChannel, message: string | BotNotification): void {
    const botChannels = this.bot.channels;
    const discordChannel = botChannels.get(channel.id.toString());
<<<<<<< HEAD
=======
    this.logDebug(`MAIN ID: ${channel.id}`);

    for (const key of botChannels.keyArray()) {
      const c = botChannels.get(key);
      this.logDebug(`ID: ${c.id}`);
    }
>>>>>>> 562356e1dd2f317702185ab5d3bee61b438f7e4f

    // Cast to the specific channel and send the message
    if (discordChannel instanceof DMChannel) {
      discordChannel.send(message);
    } else if (discordChannel instanceof TextChannel) {
      discordChannel.send(message);
    } else if (discordChannel instanceof GroupDMChannel) {
      discordChannel.send(message);
    }
  }
}

export { DiscordBot };
