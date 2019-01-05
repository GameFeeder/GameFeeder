import { Channel } from 'discord.js';
import { BotChannel } from './channel';

class DiscordChannel extends BotChannel {
  constructor(channel: Channel) {
    super('discord_channel', +channel.id);
  }
  public isEqual(other: BotChannel): boolean {
    if (other instanceof DiscordChannel) {
      return ((this.label === other.label) && (this.id === other.id));
    }
    return false;
  }
}

export { DiscordChannel };
