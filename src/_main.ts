import botLogger from './bot_logger';
import getBots from './bots';
import commands from './commands';
import Updater from './updater';
import InitManager from './init_manager';
import ProjectManager from './project_manager';

/** Registers the bot commands. */
async function registerCommands() {
  for (const command of commands) {
    for (const bot of getBots()) {
      bot.registerCommand(command);
    }
    botLogger.debug(`Registered command: '${command.label}'.`, 'Main');
  }
  botLogger.info('Registered commands.', 'Main');
}

/** Starts the bots. */
async function startBots() {
  // Start bots
  for (const bot of getBots()) {
    if (bot.autostart) {
      if (await bot.start()) {
        const userName = await bot.getUserName();
        bot.logInfo(`Started bot as @${userName}`);
      } else {
        bot.logWarn('Bot did not start. Did you provide a token in "bot_config.json"?');
      }
    } else {
      bot.logDebug('Autostart disabled.');
    }
  }
}

/** Starts the updater. */
async function startUpdater() {
  if (Updater.getUpdater().autostart) {
    Updater.getUpdater().start();
    Updater.getUpdater().info('Started updater.');
  }
}

/** Registers the commands, starts the bots and the updater. */
async function start() {
  botLogger.info(
    `Starting main in ${ProjectManager.getEnvironment()} mode,`
    + ` v${ProjectManager.getVersionNumber()}.`,
    'Main',
  );
  InitManager.initAll();
  await registerCommands();
  await startBots();
  await startUpdater();
}

start();
