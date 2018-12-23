const DiscordBot = require('./discord');
const TelegramBot = require('./telegram');
const Data = require('./data');

const discordAutostart = Data.getBotConfig().discord.autostart;
const telegramAutostart = Data.getBotConfig().telegram.autostart;

function startBots() {
  if (discordAutostart) {
    DiscordBot.start();
  } else {
    console.warn('[Discord] Bot disabled. To enable, set the "autostart" parameter in "bot_config.json".');
  }
  if (telegramAutostart) {
    TelegramBot.start();
  } else {
    console.warn('[Telegram] Bot disabled. To enable, set the "autostart" parameter in "bot_config.json".');
  }
}

startBots();
