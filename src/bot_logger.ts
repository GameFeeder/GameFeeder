import { Format } from 'logform';
import Winston from 'winston';

class Logger {
  private format: Format;
  private logger: Winston.Logger;

  constructor() {
    // Format: Aligned with colors and time
    this.format = Winston.format.combine(
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

    // Create logger
    this.logger = Winston.createLogger({
      format: this.format,
      level: process.env.LOG_LEVEL || 'debug',
      transports: [new Winston.transports.Console()],
    });
  }
  /** Logs a debug message.
   *
   * @param  {string} message - The message to debug-log.
   * @returns void
   */
  public debug(message: string, label?: string | null): void {
    this.logger.debug({ message, label });
  }

  /** Logs an info message.
   *
   * @param  {string} message - The message to info-log.
   * @returns void
   */
  public info(message: string, label?: string | null): void {
    this.logger.info({ message, label });
  }

  /** Logs a warning message.
   *
   * @param  {string} message - The message to warn-log.
   * @returns void
   */
  public warn(message: string, label?: string | null): void {
    this.logger.warn({ message, label });
  }

  /** Logs an error message.
   *
   * @param  {string} message - The message to error-log.
   * @returns void
   */
  public error(message: string, label?: string | null): void {
    this.logger.error({ message, label });
  }
}

// The logger we use
const botLogger = new Logger();

export default botLogger;
