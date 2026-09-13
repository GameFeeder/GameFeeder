import Game from '../game.js';
import type { ProviderData } from '../managers/data_manager.js';
import type { HtmlParseOptions } from '../markup/parsers/html.js';
import Notification from '../notifications/notification.js';
import NotificationBuilder from '../notifications/notification_builder.js';
import PreProcessor from '../processors/pre_processor.js';
import SteamProcessor from '../processors/steam_processor.js';
import { rss } from '../rss/rss.js';
import Provider from './provider.js';

export default class RSSProvider extends Provider {
  public preProcessors: PreProcessor[];
  /** How the HTML of this feed's flavor is to be read. */
  public htmlOptions: HtmlParseOptions;

  constructor(
    url: string,
    label: string,
    game: Game,
    public flavor?: string,
  ) {
    super(url, label, game);

    this.preProcessors = [];
    this.htmlOptions = {};

    // Add pre-processors
    if (flavor === 'steam') {
      this.preProcessors.push(new SteamProcessor());
      // Steam writes its Community posts as text with a few tags sprinkled in,
      // relying on blank lines for paragraphs rather than on markup. Ordinary
      // blog feeds emit real HTML, where a line break is only whitespace.
      this.htmlOptions = { preserveLineBreaks: true };
    }
  }

  public async getNotifications(since: ProviderData, limit?: number): Promise<Notification[]> {
    const feedItems = await rss.getFeedItems(
      this.url,
      this.preProcessors,
      this.htmlOptions,
      this.getLastUpdateTimestamp(since),
      limit,
    );
    const notifications: Notification[] = feedItems.map((feedItem) => {
      return new NotificationBuilder(feedItem.timestamp)
        .withTitle(feedItem.title, feedItem.link)
        .withGameDefaults(this.game)
        .withContent(feedItem.content)
        .withAuthor(feedItem.author)
        .build();
    });
    return notifications;
  }
}
