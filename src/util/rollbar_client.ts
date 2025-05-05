import Rollbar from 'rollbar';
import ConfigManager from '../managers/config_manager.js';
import Logger from '../logger.js';
import ProjectManager from '../managers/project_manager.js';
import { StrUtil } from './util.js';

/**
 * A singleton class for managing the Rollbar error tracking client
 */
class RollbarClient {
  private static instance: RollbarClient;
  private rollbar: Rollbar | undefined;
  private logger = new Logger('RollbarClient');

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.initialize();
  }

  /**
   * Get the singleton instance of RollbarClient
   */
  public static getInstance(): RollbarClient {
    if (!RollbarClient.instance) {
      RollbarClient.instance = new RollbarClient();
    }
    return RollbarClient.instance;
  }

  /**
   * Initialize Rollbar client based on configuration
   */
  private initialize(): void {
    // Get Rollbar configuration
    const rollbarConfig = ConfigManager.getRollbarConfig();

    // Initialize Rollbar only if enabled in config
    if (rollbarConfig.enabled && rollbarConfig.accessToken) {
      this.rollbar = new Rollbar({
        accessToken: rollbarConfig.accessToken,
        environment: ProjectManager.getEnvironment(),
        captureUncaught: true,
        captureUnhandledRejections: true,
        code_version: ProjectManager.getVersionNumber(),
      });

      this.logger.info('Rollbar client initialized successfully');
    } else {
      this.logger.warn('Rollbar client disabled or missing access token');
    }
  }

  /**
   * Log a message to Rollbar with level 'debug'
   */
  public debug(message: string, ...args: Rollbar.LogArgument[]): void {
    if (!this.rollbar) {
      return;
    }

    this.rollbar.debug(message, ...args);
  }

  /**
   * Log a message to Rollbar with level 'info'
   */
  public info(message: string, ...args: Rollbar.LogArgument[]): void {
    if (!this.rollbar) {
      return;
    }

    this.rollbar.info(message, ...args);
  }

  /**
   * Log a message to Rollbar with level 'warning'
   */
  public warning(message: string, ...args: Rollbar.LogArgument[]): void {
    if (!this.rollbar) {
      return;
    }

    this.rollbar.warning(message, ...args);
  }

  /**
   * Log a message to Rollbar with level 'error'
   */
  public error(message: string, ...args: Rollbar.LogArgument[]): void {
    if (!this.rollbar) {
      return;
    }

    this.rollbar.error(message, ...args);
  }

  /**
   * Log a message to Rollbar with level 'critical'
   */
  public critical(message: string, ...args: Rollbar.LogArgument[]): void {
    if (!this.rollbar) {
      return;
    }
    this.rollbar.critical(message, ...args);
  }

  public reportCaughtError(message: string, error: unknown, logger: Logger): void {
    logger.error(`${message}\n${StrUtil.naturalLimit(`${error}`, 5000)}`);

    if (!this.rollbar) {
      return;
    }

    if (error instanceof Error) {
      this.rollbar.error(message, error);
    } else {
      this.rollbar.error(message, new Error(String(error)));
    }
  }
}

// Export the singleton instance
export default RollbarClient.getInstance();
