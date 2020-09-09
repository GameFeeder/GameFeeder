import Game from '../game';
import Notification from '../notifications/notification';
import Provider from './provider';
import { rss } from '../rss/rss';
import PreProcessor from '../processors/pre_processor';
import SteamProcessor from '../processors/steam_processor';
import NotificationBuilder from '../notifications/notification_builder';
import Updater from '../updater';

export default class RSSProvider extends Provider {
  public preProcessors: PreProcessor[];

  constructor(url: string, label: string, game: Game, public flavor?: string) {
    super(url, label, game);

    this.preProcessors = [];

    // Add pre-processors
    if (flavor === 'steam') {
      this.preProcessors.push(new SteamProcessor());
    }
  }

  public async getNotifications(updater: Updater, limit?: number): Promise<Notification[]> {
    const feedItems = await rss.getFeedItems(
      this.url,
      this.preProcessors,
      this.getLastUpdateTimestamp(updater),
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
