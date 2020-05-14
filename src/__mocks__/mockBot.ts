import BotClient from '../bots/bot';
import Channel from '../channel';
import Game from '../game';
import Notification from '../notifications/notification';
import Permissions from '../permissions';
import User, { UserRole } from '../user';

jest.mock('request-promise-native');

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

  public async start(): Promise<boolean> {
    this.logger.debug(`Starting mock bot`);
    return true;
  }

  public stop(): void {
    this.logger.debug(`Stopping mock bot`);
  }

  public async getUserRole(user: User, channel: Channel): Promise<UserRole> {
    this.logger.debug(`Getting role for user ${user.id} for channel ${channel.id}`);
    // TODO: Add mock user and user role
    return UserRole.USER;
  }

  public async getUserPermissions(user: User, channel: Channel): Promise<Permissions> {
    this.logger.debug(`Getting user permissions for user ${user.id} for channel ${channel.id}`);
    // TODO: Mock permissions?
    return new Permissions(false, false, false, false);
  }

  public async getOwners(): Promise<User[]> {
    // TODO: Mock owners?
    return [];
  }

  public async getUser(): Promise<User> {
    return new User(this, 'mockUser');
  }

  public async getChannelUserCount(channel: Channel): Promise<number> {
    this.logger.debug(`Getting user count for channel ${channel.id}`);
    return 0;
  }

  public async getUserCount(game?: Game): Promise<number> {
    this.logger.debug(`Getting user count for game ${game?.name}`);
    return 0;
  }

  public async getChannelCount(game?: Game): Promise<number> {
    this.logger.debug(`Getting channel count for game ${game?.name}`);
    return 0;
  }

  public async sendMessage(channel: Channel, message: string | Notification): Promise<boolean> {
    this.logger.debug(`Sending message ${message} to channel ${channel.id}`);
    return true;
  }
}
