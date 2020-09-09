import Winston from 'winston';

const winstonFormat = Winston.format.combine(
  Winston.format.colorize(),
  Winston.format.timestamp(),
  Winston.format.printf((info) => {
    const { timestamp, label, level, message, ...args } = info;

    const ts = timestamp.slice(0, 19).replace('T', ' ');
    const obj = Object.keys(args).length ? JSON.stringify(args, null, 2) : '';
    const printLabel = label ? ` [${label}]` : '';
    return `${ts}${printLabel}\t ${level}:\t ${message} ${obj}`;
  }),
);

const winstonLogger = Winston.createLogger({
  format: winstonFormat,
  level: process.env.LOG_LEVEL || 'debug',
  transports: [new Winston.transports.Console()],
});

winstonLogger.info(`[Logger] Started logger with loglevel: ${winstonLogger.level}`, 'Logger');

export default class Logger {
  constructor(public customLabel: string) {}
  /** Logs a debug message.
   *
   * @param  {string} message - The message to debug-log.
   * @returns void
   */
  public debug(message?: string, label: string = this.customLabel): void {
    winstonLogger.debug({ message, label });
  }

  /** Logs an info message.
   *
   * @param  {string} message - The message to info-log.
   * @returns void
   */
  public info(message?: string, label: string = this.customLabel): void {
    winstonLogger.info({ message, label });
  }

  /** Logs a warning message.
   *
   * @param  {string} message - The message to warn-log.
   * @returns void
   */
  public warn(message?: string, label: string = this.customLabel): void {
    winstonLogger.warn({ message, label });
  }

  /** Logs an error message.
   *
   * @param  {string} message - The message to error-log.
   * @returns void
   */
  public error(message?: string, label: string = this.customLabel): void {
    winstonLogger.error({ message, label });
  }
}
