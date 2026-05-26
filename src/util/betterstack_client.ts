import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import Logger, { winstonLogger } from '../logger.js';
import ConfigManager from '../managers/config_manager.js';

/**
 * A singleton class for managing the BetterStack (Logtail) log forwarding client.
 * Mirrors the structure of RollbarClient so either can be removed independently.
 */
class BetterstackClient {
  private static instance: BetterstackClient;
  private logtail: Logtail | undefined;
  private logger = new Logger('BetterstackClient');

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Explicit initialization required
  }

  /**
   * Get the singleton instance of BetterstackClient
   */
  public static getInstance(): BetterstackClient {
    if (!BetterstackClient.instance) {
      BetterstackClient.instance = new BetterstackClient();
    }
    return BetterstackClient.instance;
  }

  /**
   * Initialize BetterStack client based on configuration.
   * When enabled, attaches a LogtailTransport to the shared Winston logger so
   * all log output is automatically forwarded to BetterStack Logs.
   */
  public initialize(): void {
    if (this.logtail) {
      return;
    }

    const betterstackConfig = ConfigManager.getBetterstackConfig();

    if (betterstackConfig?.enabled && betterstackConfig?.sourceToken) {
      this.logtail = new Logtail(betterstackConfig.sourceToken);

      winstonLogger.add(new LogtailTransport(this.logtail));

      // Flush buffered logs on clean shutdown so nothing is lost
      for (const signal of ['SIGINT', 'SIGTERM', 'beforeExit'] as const) {
        process.on(signal, () => {
          this.logtail?.flush().catch(() => {
            // Best-effort; the process is already exiting
          });
        });
      }

      this.logger.info('BetterStack client initialized successfully');
    } else {
      this.logger.warn('BetterStack client disabled or missing source token');
    }
  }
}

// Export the singleton instance
export default BetterstackClient.getInstance();
