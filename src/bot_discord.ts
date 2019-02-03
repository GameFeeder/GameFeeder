import DiscordAPI, { DMChannel, GroupDMChannel, TextBasedChannel, TextChannel } from 'discord.js';
import { BotClient } from './bot';
import BotChannel from './channel';
import { getBotConfig } from './data';
import BotNotification from './notification';

export default class DiscordBot extends BotClient {
  private bot: DiscordAPI.Client;
  private token: string;

  constructor(prefix: string, token: string) {
    super('discord', 'Discord', prefix);

    // Set up the bot
    this.token = token;
    this.bot = new DiscordAPI.Client();
  }

  public registerCommand(reg: RegExp, callback: (channel: BotChannel, match: RegExpExecArray) => void): void {
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
      this.isRunning = true;
      return true;
    } else {
      return false;
    }
  }
  public stop(): void {
    this.bot.destroy();
    this.isRunning = false;
  }

  public sendMessageToChannel(channel: BotChannel, message: string | BotNotification): boolean {
    if (typeof message === 'string') {
      // Parse markdown
      message = this.msgFromMarkdown(message, false);
      return this.sendToChannel(channel, message);
    } else {
      // Parse markdown
      const text = `${this.msgFromMarkdown(message.text, false)}\n${message.title.link}`;
      const embed = this.embedFromNotification(message);

      try {
        return this.sendToChannel(channel, '', embed);
      } catch (error) {
        return false;
      }
    }
  }
  public embedFromNotification(notification: BotNotification): DiscordAPI.RichEmbed {
    const embed = new DiscordAPI.RichEmbed();
    // Title
    if (notification.title) {
      const titleMD = this.msgFromMarkdown(notification.title.text, true);
      embed.setTitle(titleMD);
      if (notification.title.link) {
        embed.setURL(notification.title.link);
      }
    }
    // Author
    if (notification.author) {
      const authorMD = this.msgFromMarkdown(notification.author.text, true);
      if (notification.author.icon && notification.author.link) {
        embed.setAuthor(authorMD, notification.author.icon, notification.author.link);
      } else {
        embed.setAuthor(authorMD);
      }
    }
    // Color
    if (notification.color) {
      embed.setColor(notification.color);
    }
    // Description
    if (notification.description) {
      const descriptionMD = this.msgFromMarkdown(notification.description, true);
      if (descriptionMD.length > 2048) {
        embed.setDescription(descriptionMD.substring(0, 2048));
      } else {
        embed.setDescription(descriptionMD);
      }
    }
    // Footer
    if (notification.footer) {
      const footerMD = this.msgFromMarkdown(notification.footer.text, true);
      if (notification.footer.icon) {
        embed.setFooter(footerMD, notification.footer.icon);
      } else {
        embed.setFooter(footerMD);
      }
    }
    // Image
    if (notification.image) {
      embed.setImage(notification.image);
    }
    // Thumbnail
    if (notification.thumbnail) {
      this.logDebug(`ThumbnailUrl: '${notification.thumbnail}'`);
      embed.setThumbnail(notification.thumbnail);
    }
    // Timestamp
    if (notification.timestamp) {
      embed.setTimestamp(notification.timestamp);
    }
    return embed;
  }

  public msgFromMarkdown(markdown: string, isEmbed: boolean): string {
    if (!isEmbed) {
      // Short links are not supported outside of embeds
      markdown = markdown.replace(/\[(.*)\]\((.*)\)/, '$1 ($2)');
    }

    // Compress multiple linebreaks
    // markdown = markdown.replace(/\n+/, '\n');

    // Linewise formatting
    const lineArray = markdown.split('\n');
    for (let i = 0; i < lineArray.length; i++) {
      // H1-3
      lineArray[i] = lineArray[i].replace(/^\s*##?#?\s*(.*)/, '__**$1**__');
      // H4-6
      lineArray[i] = lineArray[i].replace(/^\s*#####?#?\s*(.*)/, '**$1**');
      // Lists
      lineArray[i] = lineArray[i].replace(/^\s*\*\s+/, '- ');
    }

    let newMarkdown = '';
    for (const line of lineArray) {
      newMarkdown += line + '\n';
    }

    return newMarkdown;
  }

  private sendToChannel(channel: BotChannel, text: string, embed?: any): boolean {
    const botChannels = this.bot.channels;
    const discordChannel = botChannels.get(channel.id);

    if (!discordChannel) {
      return false;
    }

    if (discordChannel instanceof DMChannel) {
      discordChannel.send(text, embed);
      return true;
    } else if (discordChannel instanceof TextChannel) {
      discordChannel.send(text, embed);
      return true;
    } else if (discordChannel instanceof GroupDMChannel) {
      discordChannel.send(text, embed);
      return true;
    } else {
      return false;
    }
  }
}

// Discord Bot
const { prefix: discordPrefix, token: discordToken } = getBotConfig().discord;
const discordBot = new DiscordBot(discordPrefix, discordToken);

export { DiscordBot, discordBot };
