import bots from './bots';
import { commands } from './command';
import botLogger from './logger';
import updater from './updater';

// Register commands
for (const command of commands) {
  for (const bot of bots) {
    bot.registerCommand(command);
  }
  botLogger.debug(`Registered command: '${command.label}'.`, 'Main');
}
botLogger.info('Registered commands.', 'Main');

// Start bots
for (const bot of bots) {
  if (bot.autostart) {
    if (bot.start()) {
      bot.logInfo('Started bot.');
    } else {
      bot.logWarn('Bot did not start. Did you provide a token in "bot_config.json"?');
    }
  } else {
    bot.logDebug('Autostart disabled.');
  }
}

// Start updater
if (updater.autostart) {
  updater.start();
  updater.info('Started updater.');
}
