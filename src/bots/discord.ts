import DiscordAPI, { DMChannel, GroupDMChannel, TextChannel } from 'discord.js';
import { BotClient } from './bot';
import User, { UserRole } from '../user';
import Channel from '../channel';
import Command from '../commands/command';
import ConfigManager from '../managers/config_manager';
import Notification from '../notifications/notification';
import MDRegex from '../util/regex';
import { StrUtil, mapAsync } from '../util/util';
import Message from '../message';
import Permissions from '../permissions';

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

  public async getUser(): Promise<User> {
    const userID = this.bot.user.id;
    return new User(this, userID);
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

  public async getChannelCount(): Promise<number> {
    let channels = this.getBotChannels();
    // Save guilds
    const seenGuilds = new Map<string, boolean>();
    // Only consider each guild once
    channels = channels.filter((channel) => {
      const discordChannel = this.bot.channels.get(channel.id);
      if (discordChannel instanceof TextChannel) {
        const guildID = discordChannel.guild.id;
        const isDuplicate = seenGuilds.get(guildID);
        seenGuilds.set(guildID, true);
        return !isDuplicate;
      }
      return true;
    });

    return channels.length;
  }

  public async getUserCount(): Promise<number> {
    let channels = this.getBotChannels();
    // Save guilds
    const seenGuilds = new Map<string, boolean>();
    // Only consider each guild once
    channels = channels.filter((channel) => {
      const discordChannel = this.bot.channels.get(channel.id);
      if (discordChannel instanceof TextChannel) {
        const guildID = discordChannel.guild.id;
        const isDuplicate = seenGuilds.get(guildID);
        seenGuilds.set(guildID, true);
        return !isDuplicate;
      }
      return true;
    });

    // Aggregate results
    const userCounts = await mapAsync(
      channels,
      async (botChannel) => await botChannel.getUserCount(),
    );
    const userCount = userCounts.reduce((prevValue, curValue) => prevValue + curValue, 0);
    return userCount;
  }

  public async getUserRole(user: User, channel: Channel): Promise<UserRole> {
    // Check if the user is one of the owners
    const ownerIds = (await this.getOwners()).map((owner) => owner.id);
    if (ownerIds.includes(user.id)) {
      return UserRole.OWNER;
    }

    const discordChannel = this.bot.channels.get(channel.id);
    // Check if the user has default admin rights
    if (discordChannel instanceof DMChannel || discordChannel instanceof GroupDMChannel) {
      return UserRole.ADMIN;
    }
    if (discordChannel instanceof TextChannel) {
      // Check if the user is an admin on this channel
      const discordUser = discordChannel.members.get(user.id);
      if (discordUser.hasPermission(8)) {
        return UserRole.ADMIN;
      }
    }
    // The user is just a regular user
    return UserRole.USER;
  }

  public async getUserPermissions(user: User, channel: Channel): Promise<Permissions> {
    const discordChannel = this.bot.channels.get(channel.id);

    let hasAccess;
    let canWrite;
    let canEdit;
    let canPin;

    if (!discordChannel) {
      // The user has been kicked from the channel
      hasAccess = false;
      canWrite = false;
      canEdit = false;
      canPin = false;
    } else if (discordChannel instanceof DMChannel) {
      // You always have all permissions in DM and group channels
      hasAccess = true;
      canWrite = true;
      canEdit = true;
      canPin = true;
    } else if (discordChannel instanceof TextChannel) {
      // Check for the permissions
      const discordUser = discordChannel.members.get(user.id);
      const discordPermissions = discordChannel.permissionsFor(discordUser);
      hasAccess = discordPermissions.has(['VIEW_CHANNEL', 'READ_MESSAGES']);
      canWrite = hasAccess && discordPermissions.has('SEND_MESSAGES');
      canEdit = hasAccess && discordPermissions.has('MANAGE_MESSAGES');
      canPin = hasAccess && discordPermissions.has('MANAGE_MESSAGES');
    } else {
      this.logger.error(`Unecpected Discord channel type: ${discordChannel}`);
      hasAccess = false;
      canWrite = false;
      canEdit = false;
      canPin = false;
    }

    const permissions = new Permissions(hasAccess, canWrite, canEdit, canPin);
    return permissions;
  }

  /** Determines if the user can send embedded links.
   *
   * @param user - The user to get the permission for.
   * @param channel - The channel to get the permission on.
   */
  public async canEmbed(user: User, channel: Channel): Promise<boolean> {
    const discordChannel = this.bot.channels.get(channel.id);

    let canEmbed;

    if (discordChannel instanceof DMChannel) {
      // You always have all permissions in DM and group channels
      canEmbed = true;
    } else if (discordChannel instanceof TextChannel) {
      // Check for the permissions
      const discordUser = discordChannel.members.get(user.id);
      const hasAccess = discordChannel
        .permissionsFor(discordUser)
        .has(['VIEW_CHANNEL', 'READ_MESSAGES']);
      canEmbed = discordChannel.permissionsFor(discordUser).has('EMBED_LINKS');
    } else {
      this.logger.error(`Unecpected Discord channel type.`);
      canEmbed = false;
    }

    return canEmbed;
  }

  public async getOwners(): Promise<User[]> {
    const ownerIds: string[] = ConfigManager.getBotConfig().discord.owners;
    return ownerIds.map((id) => new User(this, id));
  }

  public async registerCommand(command: Command): Promise<void> {
    this.bot.on('message', async (msg) => {
      const channel = this.getChannelByID(msg.channel.id);
      const user = new User(this, msg.author.id);
      const timestamp = msg.createdAt;
      const content = msg.toString();

      const reg = await command.getRegExp(channel);
      // Run regex on the msg
      const regMatch = reg.exec(content);
      const message = new Message(user, channel, content, timestamp);
      // If the regex matched, execute the handler function
      if (regMatch) {
        // Execute the command
        command.execute(this, message, regMatch);
      }
    });
  }
  public async start(): Promise<boolean> {
    if (this.token) {
      await this.bot.login(this.token);
      this.isRunning = true;
      // Handle being removed from a guild
      this.bot.on('guildDelete', async (guild) => {
        const guildID = guild.id;
        const channels = this.getBotChannels();

        // Remove all channel data of that guild
        for (const channel of channels) {
          const discordChannel = this.bot.channels.get(channel.id);
          if (!discordChannel) {
            // Can't find the channel, it probably belongs to the guild, remove data
            await this.onRemoved(channel);
          } else if (discordChannel instanceof TextChannel) {
            const channelGuildID = discordChannel.guild.id;
            if (guildID === channelGuildID) {
              // The channel belongs to the guild, remove data
              await this.onRemoved(channel);
            }
          }
        }
      });
      // Handle deleted channels
      this.bot.on('channelDelete', async (discordChannel) => {
        const channels = this.getBotChannels();

        // Search for the deleted channel
        for (const channel of channels) {
          if (channel.id === discordChannel.id) {
            await this.onRemoved(channel);
          }
        }
      });
      return true;
    }

    return false;
  }
  public stop(): void {
    this.bot.destroy();
    this.isRunning = false;
  }

  public async sendMessage(channel: Channel, message: string | Notification): Promise<boolean> {
    // Check if the bot can write to this channel
    const permissions = await this.getUserPermissions(await this.getUser(), channel);
    if (!permissions.canWrite) {
      if (this.removeData(channel)) {
        this.logger.warn(`Can't write to channel, removing all data.`);
      }
      return false;
    }
    if (typeof message === 'string') {
      // Parse markdown
      const messageText = DiscordBot.msgFromMarkdown(message, false);
      try {
        return await this.sendToChannel(channel, messageText);
      } catch (error) {
        this.logger.error(`Failed to send message:\n${error}`);
        return false;
      }
    }
    // Check if the bot can send embeds
    if (await this.canEmbed(await this.getUser(), channel)) {
      // Parse markdown
      const embed = this.embedFromNotification(message);

      try {
        return await this.sendToChannel(channel, '', embed);
      } catch (error) {
        this.logger.error(`Failed to send message:\n${error}`);
        return false;
      }
    }

    // Convert to text and send it
    const messageText = DiscordBot.msgFromMarkdown(message.toMDString(2000), false);
    try {
      return await this.sendToChannel(channel, messageText);
    } catch (error) {
      this.logger.error(`Failed to send message:\n${error}`);
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
    let discordChannel;
    try {
      discordChannel = botChannels.get(channel.id);
    } catch (error) {
      this.logger.error(`Failed to get discord channel:\n${error}`);
      return false;
    }

    if (!discordChannel) {
      return false;
    }

    const callback = (error: any) => {
      let errorMsg;
      if (error instanceof Error) {
        errorMsg = `${error.name}: ${error.message}`;
      } else {
        errorMsg = error.toString();
      }
      this.logger.error(`Failed to send message to channel:\n${errorMsg}`);
      return false;
    };

    try {
      if (discordChannel instanceof DMChannel) {
        discordChannel.send(text, embed).catch(callback);
        return true;
      }
      if (discordChannel instanceof TextChannel) {
        discordChannel.send(text, embed).catch(callback);
        return true;
      }
      if (discordChannel instanceof GroupDMChannel) {
        discordChannel.send(text, embed).catch(callback);
        return true;
      }
    } catch (error) {
      this.logger.error(`Failed to send message to channel:\n${error}`);
    }
    return false;
  }
}
