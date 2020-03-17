import Logger from './logger';
import getBots from './bots/bots';
import commands from './commands/commands';
import Updater from './updater';
import InitManager from './managers/init_manager';
import ProjectManager from './managers/project_manager';
import { mapAsync, naturalJoin } from './util/util';

export default class Main {
  public static logger = new Logger('Main');

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

  /** Registers the bot commands. */
  public static async registerCommands() {
    const startTime = Date.now();
    const bots = getBots();

    // Register the commands asynchronously
    await mapAsync(bots, async (bot) => {
      bot.registerCommand(commands);
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
  public static async startBots() {
    const startTime = Date.now();
    // Start bots
    await mapAsync(getBots(), async (bot) => {
      if (bot.enabled) {
        const botStart = Date.now();
        if (await bot.start()) {
          const userName = bot.getUserName();
          const botTime = Date.now() - botStart;
          bot.logger.info(`Started bot as @${userName} in ${botTime} ms.`);
        } else {
          bot.logger.warn('Bot did not start. Did you provide a token in "bot_config.json"?');
        }
      } else {
        bot.logger.debug('Autostart disabled.');
      }
    });
    const time = Date.now() - startTime;
    Main.logger.info(`Started bots in ${time} ms.`);
  }

  /** Starts the updater. */
  public static async startUpdater() {
    if (Updater.getUpdater().enabled) {
      Updater.getUpdater().start();
      Updater.logger.info('Started updater.');
    }
  }
}

Main.start();
