import BotClient from './bot';
import BotChannel from './channel';

export default class Command {
  /** The label of the command. */
  public label: string;
  /** The label of the command trigger. Displayed in the help-command. */
  public triggerLabel: string;
  /** The RegExp string triggering the command. */
  public trigger: string;
  /** The callback function executing the command. */
  public callback: (channel: BotChannel) => void;
  /** Whether the command should use the bot prefix. */
  public hasPrefix: boolean;

  /** Create a new command.
   *
   * @param {string} trigger - The RegExp string triggering the command.
   * @param {Function} callback - The callback function executing the command.
   * @param {boolean} hasPrefix - Whether the command should use the bot prefix. Default is true.
   */
  constructor(label: string, triggerLabel: string, trigger: string,
              callback: (channel: BotChannel) => void, hasPrefix?: boolean) {
    this.trigger = trigger;
    this.callback = callback;
    this.hasPrefix = hasPrefix != null ? hasPrefix : true;
  }

  /** Gets the RegExp used to trigger the command
   *
   * @param client - The BotClient to trigger the command on.
   */
  public getRegExp(client: BotClient) {
    const prefix = this.hasPrefix ? `^(${client.prefix}\s*)` : '';

    return new RegExp(prefix + this.trigger);
  }
}
