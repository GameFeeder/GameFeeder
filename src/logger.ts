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
        const printLabel = (label) ? ` [${label}]` : '';
        return `${ts}${printLabel}\t ${level}:\t ${message} ${obj}`;
      }),
    );

    // Create logger
    this.logger = Winston.createLogger({
      format: this.format,
      level: 'debug',
      transports: [new Winston.transports.Console()],
    });
  }
  /** Logs a debug message.
   *
   * @param  {string} msg - The message to debug-log.
   * @returns void
   */
  public debug(msg: string, label?: string | null): void {
    this.logger.debug({ message: msg,  label });
  }

  /** Logs an info message.
   *
   * @param  {string} msg - The message to info-log.
   * @returns void
   */
  public info(msg: string, label?: string | null): void {
    this.logger.info({ message: msg,  label });
  }

  /** Logs a warning message.
   *
   * @param  {string} msg - The message to warn-log.
   * @returns void
   */
  public warn(msg: string, label?: string | null): void {
    this.logger.warn({ message: msg,  label });
  }

  /** Logs an error message.
   *
   * @param  {string} msg - The message to error-log.
   * @returns void
   */
  public error(msg: string, label?: string | null): void {
    this.logger.error({ message: msg,  label });
  }
}

// The logger we use
const botLogger = new Logger();

export default botLogger;
