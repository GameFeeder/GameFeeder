/** Represents a user of a bot. */
export default class BotUser {
  /** The unique ID of the user. */
  public id: string;
  /** Create a new BotUser.
   *
   * @param id - The ID of the BotUser.
   */
  constructor(id: string) {
    this.id = id;
  }
}

/** Determines the permission a user has on a channel. */
export enum UserPermission {
  /** The user is just a normal user. */
  USER,
  /** The user has admin priviliges. */
  ADMIN,
  /** The user is the owner of the bot. */
  OWNER,
}
