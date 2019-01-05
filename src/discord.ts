import { BotClient } from './bot';

class DiscordBot extends BotClient {
  public registerCommand(reg: RegExp, handler: (channel: any, match: RegExpMatchArray) => void): void {
    throw new Error('Method not implemented.');
  }
  public async start(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  public stop(): void {
    throw new Error('Method not implemented.');
  }
  public addSubscriber(channel: any, game: Game): boolean {
    throw new Error('Method not implemented.');
  }
  public removeSubscriber(channel: any, game: Game): boolean {
    throw new Error('Method not implemented.');
  }
  public sendMessageToChannel(channel: any, message: string | BotNotification): void {
    throw new Error('Method not implemented.');
  }
}

export { DiscordBot };
