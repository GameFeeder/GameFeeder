import { Game } from './game';
import BotNotification from './notification';
import NotificationElement from './notification_element';
import Provider from './provider';
import { rss } from './rss';

export default class BlogProvider extends Provider {
  constructor(url: string, label: string, game: Game) {
    super(url, label, game);
  }

  public async getNotifications(date?: Date, limit?: number): Promise<BotNotification[]> {
    const feedItems = await rss.getFeedItems(this.url, date, limit);
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
