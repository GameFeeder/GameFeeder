import Game from '../game';
import Notification from '../notifications/notification';
import Provider from './provider';
import { sortLimitEnd } from '../util/comparable';
import SteamWebAPI from '../steam/steam_web_api';

export default class SteamProvider extends Provider {
  public appID: number;
  public feeds: string[];

  constructor(appID: number, feeds: string[], game: Game) {
    super(`https://steamcommunity.com/games/${appID}/announcements`, `Steam App ${appID}`, game);
    this.appID = appID;
    this.feeds = feeds;
  }

  public async getNotifications(date?: Date, limit?: number): Promise<Notification[]> {
    try {
      // Get the news from the Steam Web API
      const steamNews = await SteamWebAPI.getNewsForApp(
        this.appID,
        length,
        date,
        limit,
        this.feeds,
      );

      // Convert to notifications
      let notifications = steamNews.toGameNotifications(this.game);
      // Limit the length
      notifications = sortLimitEnd(notifications, limit);

      return notifications;
    } catch (error) {
      this.logger.error(`Failed to get Steam news for app ${this.appID}:\n${error}`);
      return [];
    }
  }
}
