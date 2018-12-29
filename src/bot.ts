import Winston from 'winston';

abstract class BotClient {
  public name: string;
  public label: string;
  public prefix: string;

  private logger: Winston.Logger;

  constructor(name: string, label: string, prefix: string) {
    this.name = name;
    this.label = label;
    this.prefix = prefix;

    // Create logger
    const loggerFormat = Winston.format.printf((log) => {
      return `${log.timestamp} [${this.label}] ${log.level.toUpperCase()}: \t${log.message}`;
    });

    this.logger = Winston.createLogger({
      format: Winston.format.combine(
        Winston.format.timestamp(),
        loggerFormat,
      ),
      transports: [new Winston.transports.Console()],
    });
  }

  public abstract registerCommand(reg: RegExp, handler: (channel: any, match: RegExpMatchArray) => void): void;
  public abstract start(): void;
  public abstract stop(): void;

  public abstract addSubscriber(channel: any, game: Game): boolean;
  public abstract removeSubscriber(channel: any, game: Game): boolean;

  public abstract sendTextToChannel(channel: any, text: string): void;
  public abstract sendNotificationToChannel(channel: any, notification: BotNotification): void;
  public abstract sendTextToGameSubs(game: Game, text: string): void;
  public abstract sendNotificationToGameSubs(game: Game, notification: BotNotification): void;

  public sendTextToAllSubs(text: string): void {
    // TODO
  }

  /**
   * Sends a notification to all subscribers.
   *
   * @param  {BotNotification} msg - The message to error-log.
   * @returns void
   */
  public sendNotificationToAllSubs(notification: BotNotification): void {
    // TODO
  }

  /**
   * Logs a debug message.
   *
   * @param  {string} msg - The message to debug-log.
   * @returns void
   */
  public logDebug(msg: string): void {
    this.logger.debug(msg);
  }

  /**
   * Logs an info message.
   *
   * @param  {string} msg - The message to info-log.
   * @returns void
   */
  public logInfo(msg: string): void {
    this.logger.info(msg);
  }

  /**
   * Logs a warning message.
   *
   * @param  {string} msg - The message to warn-log.
   * @returns void
   */
  public logWarn(msg: string): void {
    this.logger.warn(msg);
  }

  /**
   * Logs an error message.
   *
   * @param  {string} msg - The message to error-log.
   * @returns void
   */
  public logError(msg: string): void {
    this.logger.error(msg);
  }
}
