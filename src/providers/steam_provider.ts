import Game from '../game.js';
import Notification from '../notifications/notification.js';
import Provider from './provider.js';
import { sortLimitEnd } from '../util/array_util.js';
import SteamWebAPI from '../steam/steam_web_api.js';
import { ProviderData } from '../managers/data_manager.js';

export default class SteamProvider extends Provider {
  constructor(
    public appID: number,
    public feeds: string[],
    game: Game,
  ) {
    super(`https://steamcommunity.com/games/${appID}/announcements`, `Steam App ${appID}`, game);
  }

  public async getNotifications(since: ProviderData, limit?: number): Promise<Notification[]> {
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

      if (this.getLastUpdateTimestamp(since)) {
        // Filter out outdated posts
        notifications = notifications.filter((notification) => {
          return notification.timestamp > this.getLastUpdateTimestamp(since);
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
