import RSSParser from 'rss-parser';
import TurndownService from 'turndown';
import RSSItem from './rss_item';
import { sortLimitEnd } from './comparable';
import Logger from './bot_logger';

export default class RSS {
  public static logger = new Logger('RSS');
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
        const title = item.title;
        const creator = item.creator || '';
        const link = item.link || '';
        const content = item.content;
        const postDate = new Date(item.isoDate) || new Date();

        if (title && content) {
          const rssItem = new RSSItem(title, creator, link, converter.turndown(content), postDate, {
            link: feed,
            name: feed.title,
            source: '',
          });
          if (!date || rssItem.timestamp > date) {
            feedItems.push(rssItem);
          }
        }
      }

      // Only take the newest feedItems
      feedItems = sortLimitEnd(feedItems, limit);

      return feedItems;
    } catch (error) {
      RSS.logger.error(`Failed to parse feed url '${url}':\n${error}`);
      return [];
    }
  }
}

const rss = new RSS();

export { RSS, rss };
