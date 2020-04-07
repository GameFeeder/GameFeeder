import Game from '../game';
import Notification from '../notifications/notification';
import Provider from './provider';
import { rss } from '../rss/rss';
import PreProcessor from '../processors/pre_processor';
import SteamProcessor from '../processors/steam_processor';

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

  public async getNotifications(date?: Date, limit?: number): Promise<Notification[]> {
    const feedItems = await rss.getFeedItems(this.url, this.preProcessors, date, limit);
    const notifications: Notification[] = feedItems.map((feedItem) => {
      return new Notification(feedItem.timestamp)
        .withTitle(feedItem.title, feedItem.link)
        .withGameDefaults(this.game)
        .withContent(feedItem.content)
        .withAuthor(feedItem.author);
    });
    return notifications;
  }
}
