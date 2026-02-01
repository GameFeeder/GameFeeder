import Logger from './logger.js';
import getBots from './bots/bots.js';
import Updater from './updater.js';
import InitManager from './managers/init_manager.js';
import ProjectManager from './managers/project_manager.js';
import ConfigManager from './managers/config_manager.js';
import { mapAsync, naturalJoin } from './util/array_util.js';
import rollbar_client from './util/rollbar_client.js';

export default class Main {
  public static logger = new Logger('Main');

  /** Registers the commands, starts the bots and the updater. */
  public static async start(): Promise<void> {
    Main.logger.info(
      `Starting main in ${ConfigManager.getEnvironment()} mode,` +
        ` v${ProjectManager.getVersionNumber()}.`,
    );
    InitManager.initAll();
    await Main.registerCommands();
    await Main.startBots();
    Main.startUpdaters();
  }

  /** Registers the bot commands. */
  public static async registerCommands(): Promise<void> {
    const commands = (await import('./commands/commands.js')).default;
    const startTime = Date.now();
    const bots = getBots();

    bots.forEach((bot) => {
      return bot.registerCommand(commands);
    });

    const time = Date.now() - startTime;
    const cmds = commands.aggregateCmds();
    const commandStr = naturalJoin(
      cmds.map((cmd) => cmd.name),
      ', ',
    );
    Main.logger.info(`Registered ${cmds.length} commands in ${time} ms:\n${commandStr}`);
  }

  /** Starts the bots. */
  public static async startBots(): Promise<void> {
    const startTime = Date.now();
    // Start bots
    await mapAsync(getBots(), async (bot) => {
      try {
        await bot.start();
        Main.logger.info(`Started ${bot.getUserTag()}.`);
        rollbar_client.info(`Started bot ${bot.name} (${bot.getUserTag()})`);
      } catch (error) {
        rollbar_client.reportCaughtError(`Failed to start bot ${bot.name}`, error, Main.logger);
      }
    });
    const time = Date.now() - startTime;
    Main.logger.info(`Started bots in ${time} ms.`);
  }

  /** Starts the updaters. */
  public static startUpdaters(): void {
    const updaters = Updater.getUpdaters();

    updaters.forEach((updater) => {
      if (updater.enabled) {
        updater.start();
      }
    });
  }
}

Main.start();
