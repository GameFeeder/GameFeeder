import RSSParser from 'rss-parser';
import games, { Game } from './game';
import botLogger from './logger';
import RSSItem from './rss_item';

export default class RSS {
  private parser: any;

  constructor() {
    this.parser = new RSSParser();
  }

  public async getFeedItems(url: string, date?: Date, limit?: number): Promise<RSSItem[]> {
    let feedItems: RSSItem[] = [];

    const feed = await this.parser.parseURL(url);

    for (const item of feed.items) {
      const rssItem = new RSSItem(
        item.title,
        item.creator,
        item.link,
        item.content,
        new Date(item.isoDate),
        {
          link: feed,
          name: feed.title,
          source: '',
        },
      );
      feedItems.push(rssItem);
    }

    // Sort the items by date
    feedItems.sort((a, b) => {
      return a.compare(b);
    });

    // Only take the newest entries
    if (limit && (feedItems.length > limit)) {
      feedItems = feedItems.slice(0, limit);
    }

    return feedItems;
  }
}

const rss = new RSS();

export { RSS, rss};
