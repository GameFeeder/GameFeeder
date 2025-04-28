import DiscordBot from './discord.js';
import TelegramBot from './telegram.js';
import BotClient from './bot.js';

export default function getBots(): BotClient[] {
  const discordBot = DiscordBot.getBot();
  const telegramBot = TelegramBot.getBot();

  return [discordBot, telegramBot];
}
