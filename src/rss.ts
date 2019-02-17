import RSSParser from 'rss-parser';
import TurndownService from 'turndown';
import botLogger from './logger';
import RSSItem from './rss_item';
import { limitArray } from './util';

export default class RSS {
  private parser: any;

  constructor() {
    this.parser = new RSSParser();
  }

  public async getFeedItems(url: string, date?: Date, limit?: number): Promise<RSSItem[]> {
    let feedItems: RSSItem[] = [];

    try {
      const feed = await this.parser.parseURL(url);

      const converter = new TurndownService();

      for (const item of feed.items) {
        const rssItem = new RSSItem(
          item.title,
          item.creator,
          item.link,
          converter.turndown(item.content),
          new Date(item.isoDate),
          {
            link: feed,
            name: feed.title,
            source: '',
          },
        );
        if (!date || rssItem.timestamp > date) {
          feedItems.push(rssItem);
        }
      }

      // Sort the items by date
      feedItems.sort((a, b) => {
        return a.compare(b);
      });

      // Only take the newest entries
      feedItems = limitArray(feedItems, limit);

      return feedItems;
    } catch (error) {
      botLogger.error(`Failed to parse feed url '${url}':\n${error}`, 'RSS');
      return [];
    }
  }
}

const rss = new RSS();

export { RSS, rss };
