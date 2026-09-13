import RSSParser from 'rss-parser';
import Logger from '../logger.js';
import type { HtmlParseOptions } from '../markup/parsers/html.js';
import parseHtml from '../markup/parsers/html.js';
import renderPlain from '../markup/renderers/plain.js';
import PreProcessor from '../processors/pre_processor.js';
import { sortLimitEnd } from '../util/array_util.js';
import rollbar_client from '../util/rollbar_client.js';
import RSSItem from './rss_item.js';

export default class RSS {
  public static logger = new Logger('RSS');
  private parser: RSSParser;

  constructor() {
    this.parser = new RSSParser();
  }

  public async getFeedItems(
    url: string,
    preProcessors: PreProcessor[],
    htmlOptions: HtmlParseOptions = {},
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

      for (const item of feed.items ?? []) {
        const creator = item.creator || '';
        const link = item.link || '';
        let html = item.content || '';
        const postDate = item.isoDate ? new Date(item.isoDate) : new Date();

        // Apply pre-processing
        for (const processor of preProcessors) {
          html = processor.process(html);
        }

        const content = parseHtml(html, htmlOptions);
        // A title renders no markup wherever it is shown.
        const title = item.title ? renderPlain(parseHtml(item.title)) : '';

        if (title && content.children.length > 0) {
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
      rollbar_client.reportCaughtError(`Failed to parse feed url ${url}`, error, RSS.logger);
      return [];
    }
  }
}

const rss = new RSS();

export { RSS, rss };
