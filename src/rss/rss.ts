import RSSParser from 'rss-parser';
import TurndownService from 'turndown';
import RSSItem from './rss_item';
import { sortLimitEnd } from '../util/array_util';
import Logger from '../logger';
import PreProcessor from '../processors/pre_processor';

export default class RSS {
  public static logger = new Logger('RSS');
  private parser: RSSParser;

  constructor() {
    this.parser = new RSSParser();
  }

  public async getFeedItems(
    url: string,
    preProcessors: PreProcessor[],
    date?: Date,
    limit?: number,
  ): Promise<RSSItem[]> {
    let feedItems: RSSItem[] = [];

    if (!url) {
      RSS.logger.warn('Trying to parse undefined URL.');
      return feedItems;
    }

    try {
      const feed = await this.parser.parseURL(url);

      const converter = new TurndownService();
      for (const item of feed.items ?? []) {
        const creator = item.creator || '';
        const link = item.link || '';
        let content = item.content || '';
        const postDate = item.isoDate ? new Date(item.isoDate) : new Date();

        // Apply pre-processing
        for (const processor of preProcessors) {
          content = processor.process(content);
        }

        // Convert to markdown
        const title = item.title ? converter.turndown(item.title) : '';
        content = converter.turndown(content);

        if (title && content) {
          const rssItem = new RSSItem(title, creator, link, content, postDate, {
            link: feed.link,
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
      if (error instanceof Error) {
        RSS.logger.error(`Failed to parse feed url '${url}':\n${error.stack}`);
      } else {
        RSS.logger.error(`Failed to parse feed url '${url}':\n${error}`);
      }
      return [];
    }
  }
}

const rss = new RSS();

export { RSS, rss };
