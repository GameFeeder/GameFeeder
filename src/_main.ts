import Logger from './bot_logger';
import getBots from './bots';
import commands from './commands';
import Updater from './updater';
import InitManager from './init_manager';
import ProjectManager from './project_manager';

export default class Main {
  public static logger = new Logger('Main');

  /** Registers the bot commands. */
  public static async registerCommands() {
    for (const command of commands) {
      for (const bot of getBots()) {
        bot.registerCommand(command);
      }
      Main.logger.debug(`Registered command: '${command.label}'.`);
    }
    Main.logger.info('Registered commands.');
  }

  /** Starts the bots. */
  public static async startBots() {
    // Start bots
    for (const bot of getBots()) {
      if (bot.enabled) {
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
  public static async startUpdater() {
    if (Updater.getUpdater().enabled) {
      Updater.getUpdater().start();
      Updater.logger.info('Started updater.');
    }
  }

  /** Registers the commands, starts the bots and the updater. */
  public static async start() {
    Main.logger.info(
      `Starting main in ${ProjectManager.getEnvironment()} mode,` +
        ` v${ProjectManager.getVersionNumber()}.`,
    );
    InitManager.initAll();
    await Main.registerCommands();
    await Main.startBots();
    await Main.startUpdater();
  }
}

Main.start();
