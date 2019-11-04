import Game from './game';
import BotNotification from './notification';
import NotificationElement from './notification_element';
import Provider from './provider';
import { rss } from './rss';
import PreProcessor from './pre_processor';
import SteamProcessor from './steam_processor';

export default class RSSProvider extends Provider {
  public flavor?: string;
  public preProcessors: PreProcessor[];

  constructor(url: string, label: string, game: Game, flavor?: string) {
    super(url, label, game);

    this.flavor = flavor;
    this.preProcessors = [];

    // Add pre-processors
    if (flavor === 'steam') {
      this.preProcessors.push(new SteamProcessor());
    }
  }

  public async getNotifications(date?: Date, limit?: number): Promise<BotNotification[]> {
    const feedItems = await rss.getFeedItems(this.url, this.preProcessors, date, limit);
    const notifications: BotNotification[] = feedItems.map((feedItem) => {
      return new BotNotification(
        this.game,
        `New post from the [${feedItem.feed.name}](${feedItem.feed.link})!`,
        new NotificationElement(feedItem.title, feedItem.link),
        feedItem.content,
        feedItem.timestamp,
        null,
        null,
        new NotificationElement(feedItem.author),
      );
    });
    return notifications;
  }
}
