import { Game } from './game';
import BotNotification from './notification';
import Provider from './provider';
import RSS from './rss';
import RSSItem from './rss_item';

export default class BlogProvider extends Provider {
  constructor(url: string, label: string, game: Game) {
    super(url, label, game);
  }

  public async getNotifications(date?: Date, limit?: number): Promise<BotNotification[]> {
    return [];
    const feedItems = await RSS.getFeedItems(this.url, date, limit);
    const notifications: BotNotification[] = feedItems.map((feedItem) => {
        return new BotNotification('New blog post!', this.game, feedItem.title, feedItem.link, feedItem.author,
        '0xFFFFFF', feedItem.content, '', '', feedItem.timestamp, '');
    });
    return notifications;
  }
}
