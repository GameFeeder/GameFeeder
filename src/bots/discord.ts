import DiscordAPI, { DMChannel, GroupDMChannel, TextChannel } from 'discord.js';
import { BotClient } from './bot';
import User, { UserPermission } from '../user';
import Channel from '../channel';
import Command from '../commands/command';
import ConfigManager from '../managers/config_manager';
import Notification from '../notifications/notification';
import MDRegex from '../util/regex';
import { StrUtil } from '../util/util';

export default class DiscordBot extends BotClient {
  private static standardBot: DiscordBot;
  private bot: DiscordAPI.Client;
  private token: string;

  constructor(prefix: string, token: string, autostart: boolean) {
    super('discord', 'Discord', prefix, autostart);

    // Set up the bot
    this.token = token;
    this.bot = new DiscordAPI.Client();
  }

  public static getBot(): DiscordBot {
    if (this.standardBot) {
      return this.standardBot;
    }
    // Discord Bot
    const {
      prefix: discordPrefix,
      token: discordToken,
      enabled: discordAutostart,
    } = ConfigManager.getBotConfig().discord;

    this.standardBot = new DiscordBot(discordPrefix, discordToken, discordAutostart);
    return this.standardBot;
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

  public async getChannelUserCount(channel: Channel): Promise<number> {
    const discordChannel = this.bot.channels.get(channel.id);

    if (discordChannel instanceof DMChannel) {
      return 1;
    }
    if (discordChannel instanceof TextChannel) {
      return discordChannel.guild.memberCount - 1;
    }
    if (discordChannel instanceof GroupDMChannel) {
      return discordChannel.recipients.size - 1;
    }
    return 0;
  }

  public async getUserPermission(user: User, channel: Channel): Promise<UserPermission> {
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

  public async getOwners(): Promise<User[]> {
    const ownerIds: string[] = ConfigManager.getBotConfig().discord.owners;
    return ownerIds.map((id) => new User(this, id));
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
        command.execute(this, channel, new User(this, message.author.id), regMatch);
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

  public async sendMessage(channel: Channel, message: string | Notification): Promise<boolean> {
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
  public embedFromNotification(notification: Notification): DiscordAPI.RichEmbed {
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
    if (notification.content) {
      const descriptionMD = DiscordBot.msgFromMarkdown(notification.content, true);
      // 2048 is the maximum notification length
      embed.setDescription(StrUtil.naturalLimit(descriptionMD, 2048));
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
      this.logger.debug(`ThumbnailUrl: '${notification.thumbnail}'`);
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

    // Links
    markdown = MDRegex.replaceLinkImage(markdown, (_, label, linkUrl, imageUrl) => {
      const newLabel = label ? label : 'Link';

      if (isEmbed) {
        if (imageUrl) {
          return `[${newLabel}](${linkUrl}) ([image](${imageUrl}))`;
        }
        return `[${newLabel}](${linkUrl})`;
      }

      return `${newLabel} (${linkUrl})`;
    });

    // Images
    markdown = MDRegex.replaceImageLink(markdown, (_, label, imageUrl, linkUrl) => {
      const newLabel = label ? label : 'Image';

      if (linkUrl) {
        if (isEmbed) {
          return `[${newLabel}](${imageUrl}) ([link](${linkUrl}))`;
        }
        return `${newLabel} (${linkUrl})`;
      }

      if (isEmbed) {
        return `[${newLabel}](${imageUrl})`;
      }

      return `${newLabel} (${imageUrl})`;
    });

    // Lists
    markdown = MDRegex.replaceList(markdown, (_, listElement) => {
      return `- ${listElement}`;
    });

    // Blockquotes
    markdown = MDRegex.replaceQuote(markdown, (_, quoteText) => {
      return `> ${quoteText}`;
    });

    // Headers
    markdown = MDRegex.replaceHeader(markdown, (_, headerText, level) => {
      // H1-3
      if (level <= 3) {
        return `\n\n__**${headerText}**__\n`;
      }

      // H4-6
      return `\n\n**${headerText}**\n`;
    });

    // Seperators
    markdown = MDRegex.replaceSeperator(markdown, (_, seperator) => {
      return `\n---\n`;
    });

    // Compress multiple linebreaks
    markdown = markdown.replace(/\s*\n\s*\n\s*/g, '\n\n');

    return markdown;
  }

  private async sendToChannel(channel: Channel, text: string, embed?: any): Promise<boolean> {
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
