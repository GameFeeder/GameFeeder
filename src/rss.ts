import { feed as feedReader } from 'feed-read';
import { Game } from './game';
import botLogger from './logger';
import RSSItem from './rss_item';

export default class RSS {
  public static async getFeedItems(url: string, date?: Date, limit?: number): Promise<RSSItem[]> {
    let feedItems: RSSItem[] = [];

    feedReader(url, (err: any, items: Array<{title: string, author: string, link: string, content: string,
      timestamp: Date, feed: {name: string, source: string, link: string}}>) => {
      if (err) {
        botLogger.error(err, 'RSS');
        return;
      }
      for (const item of items) {
        const { title, author, link, content, timestamp, feed } = item;
        const rssItem = new RSSItem(title, author, link, content, timestamp, feed);

        // Add the item if it is new enough
        if ((date && (rssItem.timestamp > date))) {
          feedItems.push(rssItem);
        }
      }
    });

    // Sort the items by date
    feedItems.sort((a, b) => {
      return a.compare(b);
    });

    // Only take the newest entries
    if (limit && (feedItems.length > limit)) {
      feedItems = feedItems.slice(feedItems.length - limit);
    }

    return feedItems;
  }
}
