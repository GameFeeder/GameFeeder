/** Represents the permissions a user has on a channel. */
export default class Permissions {
  /** Creates new permissions.
   *
   * @param hasChannelAccess - Indicates if the bot has access to a channel.
   * @param canWrite -  Indicates if the bot can write on a channel.
   * @param canEdit - Indicates if the bot can edit messages on a channel.
   * @param canPin - Indicates if the bot can pin messages on a channel.
   */
  constructor(
    public hasChannelAccess: boolean,
    public canWrite: boolean,
    public canEdit: boolean,
    public canPin: boolean,
  ) {}
}
