import TurndownService from 'turndown';
import SteamProcessor from '../processors/steam_processor.js';
import Notification from '../notifications/notification.js';
import Game from '../game.js';
import NotificationBuilder from '../notifications/notification_builder.js';

/** A news item for a Steam app. */
export type SteamNewsItemResponse = {
  /** The ID of the news item. */
  gid: number;
  /** The title of the news item. */
  title: string;
  /** The URL of the news item. */
  url: string;
  /** Determines if the URL is external. */
  // SteamWebAPI snakecase
  is_external_url: boolean;
  /** The name of the author of the news item. */
  author: string;
  /** The contents of the news item. */
  contents: string;
  /** The label of the feed this item was posted to. */
  feedlabel: string;
  /** The date of the news item (Unix time). */
  date: number;
  /** The name of the feed this item was posted to. */
  feedname: string;
  /** The type of the feed this item was posted to. */
  // SteamWebAPI snakecase
  feed_type: number;
  /** The ID of the app these news are from. */
  appid: number;
  /** The tags of this news item. */
  tags: string[];
};

/** News for a Steam app. */
export type SteamAppNewsResponse = {
  appnews: {
    /** The ID of the app that the news are for. */
    appid: number;
    /** The news items for the app. */
    newsitems: SteamNewsItemResponse[];
    /** The total number of news items. */
    count: number;
  };
};

/** A news item for a Steam app. */
export class SteamNewsItem {
  /** The ID of the news item. */
  public gID: number;
  /** The title of the news item. */
  public title: string;
  /** The URL of the news item. */
  public url: string;
  /** Determines if the URL is external. */
  public isExternalUrl: boolean;
  /** The name of the author of the news item. */
  public author: string;
  /** The contents of the news item. */
  public contents: string;
  /** The label of the feed this item was posted to. */
  public feedLabel: string;
  /** The date of the news item (Unix time). */
  public date: number;
  /** The name of the feed this item was posted to. */
  public feedName: string;
  /** The type of the feed this item was posted to. */
  public feedType: number;
  /** The ID of the app these news are from. */
  public appID: number;
  /** The tags of this news item. */
  public tags: string[];

  constructor(response: SteamNewsItemResponse) {
    const steamProcessor = new SteamProcessor();
    const turndownService = new TurndownService();

    this.gID = response.gid;
    this.title = response.title;
    this.url = response.url;
    this.isExternalUrl = response.is_external_url;
    this.author = response.author;
    // First, convert the Steam formatting to HTML, then convert the HTML to Markdown
    this.contents = turndownService.turndown(steamProcessor.process(response.contents));
    this.feedLabel = response.feedlabel;
    this.date = response.date;
    this.feedName = response.feedname;
    this.feedType = response.feed_type;
    this.appID = response.appid;
    this.tags = response.tags;
  }

  /** Converts the steam news item to a game notifications.
   *
   * @param game - The game to generate the notification for.
   */
  public toGameNotification(game: Game): Notification {
    // const steamProcessor = new SteamProcessor();
    return new NotificationBuilder(new Date(this.date * 1000))
      .withTitle(this.title, this.url)
      .withAuthor(this.author)
      .withContent(this.contents)
      .withGameDefaults(game)
      .build();
  }
}

/** News for a Steam app. */
export default class SteamAppNews {
  /** The ID of the app that the news are for. */
  public appID: number;
  /** The news items for the app. */
  public newsItems: SteamNewsItem[];

  constructor(response: SteamAppNewsResponse) {
    this.appID = response.appnews.appid;
    this.newsItems = response.appnews.newsitems
      ? response.appnews.newsitems.map((newsitem) => new SteamNewsItem(newsitem))
      : [];
  }

  /** Converts the steam app news to game notifications.
   *
   * @param game - The game to generate the notifications for.
   */
  public toGameNotifications(game: Game): Notification[] {
    return this.newsItems.map((newsItem) => newsItem.toGameNotification(game));
  }
}
