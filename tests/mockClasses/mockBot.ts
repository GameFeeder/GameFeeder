import BotClient from 'src/bots/bot';
import Channel from 'src/channel';
import Game from 'src/game';
import Notification from 'src/notifications/notification';
import Permissions from 'src/permissions';
import User, { UserRole } from 'src/user';

export default class MockBot extends BotClient {
  constructor() {
    super('mockBot', 'mockLabel', 'mockPrefix', false);
  }

  public getUserName(): string {
    return '?';
  }

  public getUserTag(): string {
    return '?';
  }

  public registerCommand(): void {
    this.logger.debug(`Registering mock command`);
  }

  public start(): Promise<boolean> {
    this.logger.debug(`Starting mock bot`);
    return Promise.resolve(true);
  }

  public stop(): void {
    this.logger.debug(`Stopping mock bot`);
  }

  public getUserRole(user: User, channel: Channel): Promise<UserRole> {
    this.logger.debug(`Getting role for user ${user.id} for channel ${channel.id}`);
    // TODO: Add mock user and user role
    return Promise.resolve(UserRole.USER);
  }

  public getUserPermissions(user: User, channel: Channel): Promise<Permissions> {
    this.logger.debug(`Getting user permissions for user ${user.id} for channel ${channel.id}`);
    // TODO: Mock permissions?
    return Promise.resolve(new Permissions(false, false, false, false));
  }

  public getOwners(): User[] {
    // TODO: Mock owners?
    return [];
  }

  public getUser(): Promise<User> {
    return Promise.resolve(new User(this, 'mockUser'));
  }

  public getChannelUserCount(channel: Channel): Promise<number> {
    this.logger.debug(`Getting user count for channel ${channel.id}`);
    return Promise.resolve(0);
  }

  public getUserCount(game?: Game): Promise<number> {
    this.logger.debug(`Getting user count for game ${game?.name}`);
    return Promise.resolve(0);
  }

  public getChannelCount(game?: Game): number {
    this.logger.debug(`Getting channel count for game ${game?.name}`);
    return 0;
  }

  public sendMessage(channel: Channel, message: string | Notification): Promise<boolean> {
    this.logger.debug(`Sending message ${message} to channel ${channel.id}`);
    return Promise.resolve(true);
  }
}
