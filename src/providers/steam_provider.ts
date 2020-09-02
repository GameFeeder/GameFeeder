import Game from '../game';
import Notification from '../notifications/notification';
import Provider from './provider';
import { sortLimitEnd } from '../util/comparable';
import SteamWebAPI from '../steam/steam_web_api';

export default class SteamProvider extends Provider {
  constructor(public appID: number, public feeds: string[], game: Game) {
    super(`https://steamcommunity.com/games/${appID}/announcements`, `App ${appID}`, game);
  }

  public async getNotifications(date?: Date, limit?: number): Promise<Notification[]> {
    if (!this.feeds || this.feeds.length === 0) {
      return [];
    }

    try {
      // Get the news from the Steam Web API
      const steamNews = await SteamWebAPI.getNewsForApp(
        this.appID,
        3000,
        undefined,
        limit,
        this.feeds,
      );

      // Convert to notifications
      let notifications = steamNews.toGameNotifications(this.game);

      if (date) {
        // Filter out outdated posts
        notifications = notifications.filter((notification) => {
          return notification.timestamp > date;
        });
      }

      // Limit the length
      notifications = sortLimitEnd(notifications, limit);

      return notifications;
    } catch (error) {
      this.logger.error(`Failed to get Steam news for app ${this.appID}:\n${error}`);
      return [];
    }
  }
}
