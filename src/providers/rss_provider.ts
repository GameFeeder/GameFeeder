import Game from '../game.js';
import Notification from '../notifications/notification.js';
import Provider from './provider.js';
import { rss } from '../rss/rss.js';
import PreProcessor from '../processors/pre_processor.js';
import SteamProcessor from '../processors/steam_processor.js';
import NotificationBuilder from '../notifications/notification_builder.js';
import { ProviderData } from '../managers/data_manager.js';

export default class RSSProvider extends Provider {
  public preProcessors: PreProcessor[];

  constructor(
    url: string,
    label: string,
    game: Game,
    public flavor?: string,
  ) {
    super(url, label, game);

    this.preProcessors = [];

    // Add pre-processors
    if (flavor === 'steam') {
      this.preProcessors.push(new SteamProcessor());
    }
  }

  public async getNotifications(since: ProviderData, limit?: number): Promise<Notification[]> {
    const feedItems = await rss.getFeedItems(
      this.url,
      this.preProcessors,
      this.getLastUpdateTimestamp(since),
      limit,
    );
    const notifications: Notification[] = feedItems.map((feedItem) => {
      return new NotificationBuilder(feedItem.timestamp)
        .withTitle(feedItem.title, feedItem.link)
        .withGameDefaults(this.game)
        .withContent(feedItem.content)
        .withAuthor(feedItem.author)
        .build();
    });
    return notifications;
  }
}
