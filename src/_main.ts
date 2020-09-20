import Logger from './logger';
import getBots from './bots/bots';
import Updater from './updater';
import InitManager from './managers/init_manager';
import ProjectManager from './managers/project_manager';
import { mapAsync, naturalJoin } from './util/array_util';

export default class Main {
  public static logger = new Logger('Main');

  /** Registers the commands, starts the bots and the updater. */
  public static async start(): Promise<void> {
    Main.logger.info(
      `Starting main in ${ProjectManager.getEnvironment()} mode,` +
        ` v${ProjectManager.getVersionNumber()}.`,
    );
    InitManager.initAll();
    await Main.registerCommands();
    await Main.startBots();
    Main.startUpdaters();
  }

  /** Registers the bot commands. */
  public static async registerCommands(): Promise<void> {
    const commands = (await import('./commands/commands')).default;
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

  /** Starts the updaters. */
  public static startUpdaters(): void {
    const updaters = Updater.getUpdaters();

    updaters.forEach((updater) => {
      if (updater.enabled) {
        updater.start();
        updater.logger.info('Started updater.');
      }
    });
  }
}

Main.start();
