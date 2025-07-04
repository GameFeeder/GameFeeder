import {
  DMChannel,
  TextChannel,
  APIEmbed,
  GatewayIntentBits,
  ActivityType,
  PermissionsBitField,
  EmbedBuilder,
  HexColorString,
  Client,
  PresenceData,
  MessageCreateOptions,
} from 'discord.js';
import { BotClient } from './bot.js';
import User, { UserRole } from '../user.js';
import Channel from '../channel.js';
import Command from '../commands/command.js';
import ConfigManager from '../managers/config_manager.js';
import Notification from '../notifications/notification.js';
import MDRegex from '../util/regex.js';
import { mapAsync } from '../util/array_util.js';
import { assertIsDefined, StrUtil } from '../util/util.js';
import Message from '../message.js';
import Permissions from '../permissions.js';
import ProjectManager from '../managers/project_manager.js';
import Game from '../game.js';

/** The maximum amount of characters allowed in the title of embeds. */
const EMBED_TITLE_LIMIT = 256;
/** The amount of characters needed to format an H1 text. */
const HEADER_FORMAT_CHARS = 4 * 2;
/** The maximum amount of characters allowed in the content of embeds. */
const EMBED_CONTENT_LIMIT = 2048;

export default class DiscordBot extends BotClient {
  private static standardBot: DiscordBot;
  private bot: Client;

  constructor(
    prefix: string,
    private token: string,
    autostart: boolean,
  ) {
    super('discord', 'Discord', prefix, autostart);

    // Set up the bot
    this.bot = new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
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

  public getUserName(): string {
    if (!this.enabled || !this.userName) {
      return '?';
    }
    return this.userName;
  }

  public getUserTag(): string {
    if (!this.enabled || !this.userTag) {
      return '?';
    }
    return this.userTag;
  }

  public getUser(): User {
    const userID = this.bot.user?.id;

    if (!userID) {
      throw new Error('Discord bot user not found.');
    }

    return new User(this, userID);
  }

  // eslint-disable-next-line require-await
  public async getChannelUserCount(channel: Channel): Promise<number> {
    const discordChannel = this.bot.channels.cache.get(channel.id);

    if (discordChannel instanceof DMChannel) {
      return 1;
    }
    if (discordChannel instanceof TextChannel) {
      return discordChannel.guild.memberCount - 1;
    }
    // Group DMs seem to be deprecated
    return 0;
  }

  public getChannelCount(game?: Game): number {
    let channels = this.getBotChannels();
    // Save guilds
    const seenGuilds = new Map<string, boolean>();
    // Only consider each guild once
    channels = channels.filter((channel) => {
      if (game && !channel.gameSubs.includes(game)) {
        return false;
      }

      const discordChannel = this.bot.channels.cache.get(channel.id);

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

  public async getUserCount(game?: Game): Promise<number> {
    let channels = this.getBotChannels();
    // Save guilds
    const seenGuilds = new Map<string, boolean>();
    // Only consider each guild once
    channels = channels.filter((channel) => {
      if (game && !channel.gameSubs.includes(game)) {
        return false;
      }

      const discordChannel = this.bot.channels.cache.get(channel.id);

      if (discordChannel instanceof TextChannel) {
        const guildID = discordChannel.guild.id;
        const isDuplicate = seenGuilds.get(guildID);
        seenGuilds.set(guildID, true);
        return !isDuplicate;
      }

      return true;
    });

    // Aggregate results
    const userCounts = await mapAsync(channels, (botChannel) => botChannel.getUserCount());
    const userCount = userCounts.reduce((prevValue, curValue) => prevValue + curValue, 0);
    return userCount;
  }

  public async getUserRole(user: User, channel: Channel): Promise<UserRole> {
    // Check if the user is one of the owners
    const ownerIds = (await this.getOwners()).map((owner) => owner.id);
    if (ownerIds.includes(user.id)) {
      return UserRole.OWNER;
    }

    const discordChannel = this.bot.channels.cache.get(channel.id);
    // Check if the user has default admin rights
    if (discordChannel instanceof DMChannel) {
      return UserRole.ADMIN;
    }
    if (discordChannel instanceof TextChannel) {
      // Check if the user is an admin on this channel
      const discordUser = discordChannel.members.get(user.id);
      if (discordUser?.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return UserRole.ADMIN;
      }
    }
    // The user is just a regular user
    return UserRole.USER;
  }

  // eslint-disable-next-line require-await
  public async getUserPermissions(user: User, channel: Channel): Promise<Permissions | undefined> {
    const channels = this.bot.channels;

    // This probably means that the Discord API is down
    assertIsDefined(channels);

    const discordChannel = this.bot.channels.cache.get(channel.id);

    if (!discordChannel) {
      // The user has been kicked from the channel
      return new Permissions(false, false, false, false);
    }

    if (discordChannel instanceof DMChannel) {
      // You always have all permissions in DM and group channels
      return new Permissions(true, true, true, true);
    }

    if (discordChannel instanceof TextChannel) {
      try {
        // Check for the permissions
        const discordUser = discordChannel.members.get(user.id);
        assertIsDefined(discordUser);

        const discordPermissions = discordChannel.permissionsFor(discordUser);
        assertIsDefined(discordPermissions);

        const hasAccess = discordPermissions.has(PermissionsBitField.Flags.ViewChannel);
        const canWrite =
          hasAccess && discordPermissions.has(PermissionsBitField.Flags.SendMessages);
        const canEdit =
          hasAccess && discordPermissions.has(PermissionsBitField.Flags.ManageMessages);
        const canPin =
          hasAccess && discordPermissions.has(PermissionsBitField.Flags.ManageMessages);

        return new Permissions(hasAccess, canWrite, canEdit, canPin);
      } catch (error) {
        this.logger.error(`Failed to get permissions for text channel ${channel.label}:\n${error}`);
        throw error;
      }
    }

    this.logger.error(
      `Unexpected Discord channel type for channel ${channel.label}: ${discordChannel}`,
    );

    return undefined;
  }

  /** Determines if the user can send embedded links.
   *SS
   * @param user - The user to get the permission for.
   * @param channel - The channel to get the permission on.
   */
  public canEmbed(user: User, channel: Channel): boolean {
    const discordChannel = this.bot.channels.cache.get(channel.id);

    let canEmbed;

    if (discordChannel instanceof DMChannel) {
      // You always have all permissions in DM and group channels
      canEmbed = true;
    } else if (discordChannel instanceof TextChannel) {
      // Check for the permissions
      const discordUser = discordChannel.members.get(user.id);
      canEmbed = discordUser
        ? (discordChannel.permissionsFor(discordUser)?.has(PermissionsBitField.Flags.EmbedLinks) ??
          false)
        : false;
    } else {
      this.logger.error(`Unecpected Discord channel type for channel ${channel.label}.`);
      canEmbed = false;
    }

    return canEmbed;
  }

  public getOwners(): User[] {
    const ownerIds: string[] = ConfigManager.getBotConfig().discord.owners;
    return ownerIds.map((id) => new User(this, id));
  }

  private addGuildRemovalHandler(): void {
    this.bot.on('guildDelete', (guild) => {
      const guildID = guild.id;
      const channels = this.getBotChannels();

      // Remove all channel data of that guild
      channels.forEach((channel) => {
        const discordChannel = this.bot.channels.cache.get(channel.id);
        if (!discordChannel) {
          // Can't find the channel, it probably belongs to the guild, remove data
          return this.onRemoved(channel);
        }

        if (discordChannel instanceof TextChannel) {
          const channelGuildID = discordChannel.guild.id;
          if (guildID === channelGuildID) {
            // The channel belongs to the guild, remove data
            return this.onRemoved(channel);
          }
        }

        // No promise needed otherwise
        return undefined;
      });
    });
  }

  addChannelDeleteHandler(): void {
    this.bot.on('channelDelete', async (discordChannel) => {
      const channels = this.getBotChannels();

      // Search for the channel
      const channel = channels.find((ch) => discordChannel.id === ch.id);
      if (channel) {
        await this.onRemoved(channel);
      }
    });
  }

  public registerCommand(command: Command): void {
    this.bot.on('messageCreate', async (msg) => {
      const channel = this.getChannelByID(msg.channel.id);
      const user = new User(this, msg.author.id);
      const now = new Date();
      // Ensure proper timestamp
      const timestamp = msg.createdAt > now ? now : msg.createdAt;
      const content = msg.toString();

      const reg = await command.getRegExp(channel);
      // Run regex on the msg
      const regMatch = reg.exec(content);
      const message = new Message(user, channel, content, timestamp);
      // If the regex matched, execute the handler function
      if (regMatch) {
        // Execute the command
        await command.execute(message, regMatch);
      }
    });
  }

  public async start(): Promise<boolean> {
    // Startup check
    if (!this.enabled) {
      this.logger.info('Autostart disabled.');
      return false;
    }
    assertIsDefined(this.token, `Token is undefined`);

    // Add handlers
    this.addGuildRemovalHandler();
    this.addChannelDeleteHandler();

    // Set up the pubsub subscriptions
    this.setupUpdaterSubscription();
    this.setupEveryoneSubscription();

    // Start the bot
    await this.bot.login(this.token);
    this.isRunning = true;

    // Setup the user
    const user = this.bot.user;
    if (!user) {
      this.logger.error('Bot user not found');
    }

    // Initialize user name and user tag
    this.userName = user?.username ?? 'UNKNOWN';
    this.userTag = `<@!${user?.id ?? 'UNKNOWN'}>`;

    const presence: PresenceData = {
      status: 'online',
      activities: [{ name: `v${ProjectManager.getVersionNumber()}`, type: ActivityType.Playing }],
    };

    // Setup presence
    try {
      this.bot.user?.setPresence(presence);
    } catch (error) {
      this.logger.error(`Failed to setup bot presence:\n${error}`);
      throw error;
    }
    return true;
  }

  public stop(): void {
    this.bot.destroy();
    this.isRunning = false;
    this.cleanupSubscriptions();
    this.logger.info(`Stopped bot.`);
  }

  public async sendMessage(channel: Channel, message: string | Notification): Promise<boolean> {
    try {
      // Check if the bot can write to this channel
      const permissions = await this.getUserPermissions(await this.getUser(), channel);

      if (!permissions) {
        this.logger.error(
          `Failed to get user permissions while sending to channel ${channel.label}`,
        );
        return false;
      }

      if (!permissions.canWrite) {
        if (this.removeData(channel)) {
          this.logger.warn(`Can't write to channel ${channel.label}, removing all data.`);
        }
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Failed to get user permissions while sending to channel ${channel.label}:\n${error}`,
      );
      return false;
    }

    if (typeof message === 'string') {
      // Parse markdown
      const messageText = DiscordBot.msgFromMarkdown(message, false);
      try {
        return await this.sendToChannel(channel, messageText);
      } catch (error) {
        this.logger.error(`Failed to send message to channel ${channel.label}:\n${error}`);
        return false;
      }
    }
    // Check if the bot can send embeds
    if (this.canEmbed(await this.getUser(), channel)) {
      // Parse markdown
      const embed = this.embedFromNotification(message);

      try {
        return await this.sendToChannel(channel, '', embed);
      } catch (error) {
        this.logger.error(`Failed to send message to channel ${channel.label}:\n${error}`);
        return false;
      }
    }

    // Convert to text and send it
    const messageText = DiscordBot.msgFromMarkdown(message.toMDString(2000), false);
    try {
      return await this.sendToChannel(channel, messageText);
    } catch (error) {
      this.logger.error(`Failed to send message to channel ${channel.label}:\n${error}`);
      return false;
    }
  }

  public embedFromNotification(notification: Notification): APIEmbed {
    const embed: EmbedBuilder = new EmbedBuilder();

    // Title
    if (notification.title) {
      // Respect title character limits
      const limitedTitle = StrUtil.naturalLimit(
        notification.title.text,
        EMBED_TITLE_LIMIT - HEADER_FORMAT_CHARS,
      );

      const titleMD = DiscordBot.msgFromMarkdown(`#${limitedTitle}`, true).trim();
      embed.setTitle(titleMD);

      if (notification.title.link) {
        embed.setURL(notification.title.link);
      }
    }
    // Author
    if (notification.author) {
      const authorMD = DiscordBot.msgFromMarkdown(notification.author.text, true);

      embed.setAuthor({
        name: authorMD,
        iconURL: notification.author?.icon,
        url: notification.author?.link,
      });
    }
    // Color
    if (notification.color) {
      embed.setColor(notification.color as HexColorString);
    }
    // Description
    if (notification.content) {
      const descriptionMD = DiscordBot.msgFromMarkdown(notification.content, true);
      // Respect the content character limit
      embed.setDescription(StrUtil.naturalLimit(descriptionMD, EMBED_CONTENT_LIMIT));
    }
    // Footer
    if (notification.footer) {
      const footerMD = DiscordBot.msgFromMarkdown(notification.footer.text, true);
      embed.setFooter({
        text: footerMD,
        iconURL: notification.footer.icon,
      });
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

    return embed.toJSON();
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
      const newLabel = label || 'Link';

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
      const newLabel = label || 'Image';

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

    // Separators
    markdown = MDRegex.replaceSeparator(markdown, () => {
      return `\n---\n`;
    });

    // Compress multiple linebreaks
    markdown = markdown.replace(/\s*\n\s*\n\s*/g, '\n\n');

    return markdown;
  }

  private async sendToChannel(channel: Channel, text: string, embed?: APIEmbed): Promise<boolean> {
    const botChannels = this.bot.channels;
    let discordChannel;
    try {
      discordChannel = botChannels.cache.get(channel.id);
    } catch (error) {
      this.logger.error(`Failed to get discord channel ${channel.label}:\n${error}`);
      return false;
    }

    if (!discordChannel) {
      return false;
    }

    const discordMessage: MessageCreateOptions = {
      // The string is not allowed to be empty
      content: text || undefined,
      embeds: embed ? [embed] : undefined,
    };

    try {
      if (discordChannel instanceof DMChannel) {
        await discordChannel.send(discordMessage);
        return true;
      }
      if (discordChannel instanceof TextChannel) {
        await discordChannel.send(discordMessage);
        return true;
      }
      // Group DMs seem to be deprecated
    } catch (error) {
      this.logger.error(`Failed to send message to channel ${channel.label}:\n${error}`);
    }
    return false;
  }
}
