/** Represents the permissions a user has on a channel. */
export default class Permissions {
  /** Indicates if the bot has access to a channel. */
  public hasChannelAccess: boolean;
  /** Indicates if the bot can write on a channel. */
  public canWrite: boolean;
  /** Indicates if the bot can edit messages on a channel. */
  public canEdit: boolean;
  /** Indicates if the bot can pin messages on a channel. */
  public canPin: boolean;

  /** Creates new permissions.
   *
   * @param hasChannelAccess - Indicates if the bot has access to a channel.
   * @param canWrite -  Indicates if the bot can write on a channel.
   * @param canEdit - Indicates if the bot can edit messages on a channel.
   * @param canPin - Indicates if the bot can pin messages on a channel.
   */
  constructor(hasChannelAccess: boolean, canWrite: boolean, canEdit: boolean, canPin: boolean) {
    this.hasChannelAccess = hasChannelAccess;
    this.canWrite = canWrite;
    this.canEdit = canEdit;
    this.canPin = canPin;
  }
}
