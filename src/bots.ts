import DiscordBot from './bot_discord';
import TelegramBot from './bot_telegram';
import BotClient from './bot';

export default function getBots(): BotClient[] {
  const discordBot = DiscordBot.getBot();
  const telegramBot = TelegramBot.getBot();

  return [discordBot, telegramBot];
}
