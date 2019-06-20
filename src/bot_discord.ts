import DiscordAPI, {
  DMChannel,
  GroupDMChannel,
  TextBasedChannel,
  TextChannel,
  User,
} from 'discord.js';
import { BotClient } from './bot';
import BotUser, { UserPermission } from './bot_user';
import BotChannel from './channel';
import Command from './command';
import ConfigManager from './config_manager';
import BotNotification from './notification';
import MDRegex from './regex';

export default class DiscordBot extends BotClient {
  private bot: DiscordAPI.Client;
  private token: string;

  constructor(prefix: string, token: string, autostart: boolean) {
    super('discord', 'Discord', prefix, autostart);

    // Set up the bot
    this.token = token;
    this.bot = new DiscordAPI.Client();
  }

  public async getUserName(): Promise<string> {
    if (!this.bot || !this.bot.user) {
      return '?';
    }
    return this.bot.user.username;
  }

  public async getUserTag(): Promise<string> {
    if (!this.bot || !this.bot.user) {
      return '?';
    }
    return `<@${this.bot.user.id}>`;
  }

  public async getChannelUserCount(channel: BotChannel): Promise<number> {
    const discordChannel = this.bot.channels.get(channel.id);

    if (discordChannel instanceof DMChannel) {
      return 1;
    }
    if (discordChannel instanceof TextChannel) {
      return discordChannel.members.size - 1;
    }
    if (discordChannel instanceof GroupDMChannel) {
      return discordChannel.recipients.size - 1;
    }
    return 0;
  }

  public async getUserPermission(user: BotUser, channel: BotChannel): Promise<UserPermission> {
    // Check if the user is one of the owners
    const ownerIds = (await this.getOwners()).map((owner) => owner.id);
    if (ownerIds.includes(user.id)) {
      return UserPermission.OWNER;
    }

    const discordChannel = this.bot.channels.get(channel.id);
    // Check if the user has default admin rights
    if (discordChannel instanceof DMChannel || discordChannel instanceof GroupDMChannel) {
      return UserPermission.ADMIN;
    }
    if (discordChannel instanceof TextChannel) {
      // Check if the user is an admin on this channel
      const discordUser = discordChannel.members.get(user.id);
      if (discordUser.hasPermission(8)) {
        return UserPermission.ADMIN;
      }
    }
    // The user is just a regular user
    return UserPermission.USER;
  }

  public async getOwners(): Promise<BotUser[]> {
    const ownerIds: string[] = ConfigManager.getBotConfig().discord.owners;
    return ownerIds.map((id) => new BotUser(this, id));
  }

  public async registerCommand(command: Command): Promise<void> {
    this.bot.on('message', async (message) => {
      const channel = this.getChannelByID(message.channel.id);
      const reg = await command.getRegExp(channel);
      // Run regex on the msg
      const regMatch = reg.exec(message.toString());
      // If the regex matched, execute the handler function
      if (regMatch) {
        // Execute the command
        command.execute(this, channel, new BotUser(this, message.author.id), regMatch);
      }
    });
  }
  public async start(): Promise<boolean> {
    if (this.token) {
      await this.bot.login(this.token);
      this.isRunning = true;
      return true;
    }

    return false;
  }
  public stop(): void {
    this.bot.destroy();
    this.isRunning = false;
  }

  public async sendMessage(
    channel: BotChannel,
    message: string | BotNotification,
  ): Promise<boolean> {
    if (typeof message === 'string') {
      // Parse markdown
      const messageText = DiscordBot.msgFromMarkdown(message, false);
      return await this.sendToChannel(channel, messageText);
    }
    // Parse markdown
    const embed = this.embedFromNotification(message);

    try {
      return await this.sendToChannel(channel, '', embed);
    } catch (error) {
      return false;
    }
  }
  public embedFromNotification(notification: BotNotification): DiscordAPI.RichEmbed {
    const embed = new DiscordAPI.RichEmbed();
    // Title
    if (notification.title) {
      const titleMD = DiscordBot.msgFromMarkdown(`#${notification.title.text}`, true);
      embed.setTitle(titleMD);
      if (notification.title.link) {
        embed.setURL(notification.title.link);
      }
    }
    // Author
    if (notification.author) {
      const authorMD = DiscordBot.msgFromMarkdown(notification.author.text, true);
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
      const descriptionMD = DiscordBot.msgFromMarkdown(notification.description, true);
      if (descriptionMD.length > 2048) {
        embed.setDescription(descriptionMD.substring(0, 2048));
      } else {
        embed.setDescription(descriptionMD);
      }
    }
    // Footer
    if (notification.footer) {
      const footerMD = DiscordBot.msgFromMarkdown(notification.footer.text, true);
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

  public static msgFromMarkdown(text: string, isEmbed: boolean): string {
    if (!text) {
      return '';
    }
    let markdown = text;

    // Bold
    markdown = MDRegex.replaceBold(markdown, (_, boldText) => {
      return `**${boldText}**`;
    });

    // Italic
    markdown = MDRegex.replaceItalic(markdown, (_, italicText) => {
      return `_${italicText}_`;
    });

    // Compress multiple linebreaks
    markdown = markdown.replace(/\s*\n\s*\n\s*/g, '\n\n');

    // Links
    markdown = MDRegex.replaceLink(markdown, (_, label, url) => {
      if (!label) {
        return url;
      }

      if (isEmbed) {
        return `[${label}](${url})`;
      }

      return `${label} (${url})`;
    });

    // Images
    markdown = MDRegex.replaceImage(markdown, (_, label, url) => {
      const newLabel = label ? label : 'Image';

      if (isEmbed) {
        return `[${newLabel}](${url})`;
      }

      return `${newLabel} (${url})`;
    });
    // markdown = markdown.replace(/\[\!\[\]\((.*)\)\]\((.*)\)/g, '[Image]($1) ([Link]($2))');
    // markdown = markdown.replace(/\[\!\[(.*)\]\((.*)\)\]\((.*)\)/g, '[$1]($2) ([Link]($3))');
    // markdown = markdown.replace(/\!\[\]\((.*)\)/g, '[Image] ($1)');
    // markdown = markdown.replace(/\!\[(.*)\]\((.*)\)/g, '[$1] ($2)');

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

    const newMarkdown = lineArray.join('\n');

    return newMarkdown;
  }

  private async sendToChannel(channel: BotChannel, text: string, embed?: any): Promise<boolean> {
    const botChannels = this.bot.channels;
    const discordChannel = botChannels.get(channel.id);

    if (!discordChannel) {
      return false;
    }

    if (discordChannel instanceof DMChannel) {
      discordChannel.send(text, embed);
      return true;
    }
    if (discordChannel instanceof TextChannel) {
      discordChannel.send(text, embed);
      return true;
    }
    if (discordChannel instanceof GroupDMChannel) {
      discordChannel.send(text, embed);
      return true;
    }
    return false;
  }
}
