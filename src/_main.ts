import Logger from './bot_logger';
import getBots from './bots';
import commands from './commands';
import Updater from './updater';
import InitManager from './init_manager';
import ProjectManager from './project_manager';

const logger = new Logger('Main');

/** Registers the bot commands. */
async function registerCommands() {
  for (const command of commands) {
    for (const bot of getBots()) {
      bot.registerCommand(command);
    }
    logger.debug(`Registered command: '${command.label}'.`);
  }
  logger.info('Registered commands.');
}

/** Starts the bots. */
async function startBots() {
  // Start bots
  for (const bot of getBots()) {
    if (bot.autostart) {
      if (await bot.start()) {
        const userName = await bot.getUserName();
        bot.logger.info(`Started bot as @${userName}`);
      } else {
        bot.logger.warn('Bot did not start. Did you provide a token in "bot_config.json"?');
      }
    } else {
      bot.logger.debug('Autostart disabled.');
    }
  }
}

/** Starts the updater. */
async function startUpdater() {
  if (Updater.getUpdater().autostart) {
    Updater.getUpdater().start();
    Updater.logger.info('Started updater.');
  }
}

/** Registers the commands, starts the bots and the updater. */
async function start() {
  logger.info(
    `Starting main in ${ProjectManager.getEnvironment()} mode,` +
      ` v${ProjectManager.getVersionNumber()}.`,
  );
  InitManager.initAll();
  await registerCommands();
  await startBots();
  await startUpdater();
}

start();
