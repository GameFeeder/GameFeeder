import DiscordBot from './bot_discord';
import TelegramBot from './bot_telegram';
import ConfigManager from './config_manager';

// Telegram Bot
const {
  prefix: telegramPrefix,
  token: telegramToken,
  autostart: telegramAutostart,
} = ConfigManager.getBotConfig().telegram;
const telegramBot = new TelegramBot(telegramPrefix, telegramToken, telegramAutostart);

// Discord Bot
const {
  prefix: discordPrefix,
  token: discordToken,
  autostart: discordAutostart,
} = ConfigManager.getBotConfig().discord;
const discordBot = new DiscordBot(discordPrefix, discordToken, discordAutostart);

// Bots
const bots = [discordBot, telegramBot];

export default bots;
