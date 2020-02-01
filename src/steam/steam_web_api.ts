import rp from 'request-promise-native';
import Logger from '../logger';

/** A wrapper around the Steam Web API.
 *
 * Documentation: https://partner.steamgames.com/doc/webapi_overview
 */
export default class SteamWebAPI {
  public static logger = new Logger('SteamWebAPI');

  /** Get the news for the specified app.
   *
   * Documentation: https://partner.steamgames.com/doc/webapi/ISteamNews
   */
  public static async getNewsForApp(
    appid: number,
    maxlength?: number,
    enddate?: Date,
    count?: number,
    feeds?: string[],
  ): Promise<SteamAppNews> {
    const newsOptions: SteamNewsOptions = {
      appid,
      count,
      maxlength,
      // Convert to Unix time
      enddate: enddate ? enddate.valueOf() / 1000 : undefined,
      // Convert to single string
      feeds: feeds ? feeds.join(',') : undefined,
    };

    const options = {
      uri: 'https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/',
      qs: newsOptions,
      json: true,
    };

    try {
      const response: SteamAppNews = await rp(options);
      return response;
    } catch (error) {
      this.logger.error(`Failed to get news for app ${appid}:\n${error}`);
      // Return empty news
      const respose: SteamAppNews = { appid, newsitems: [] };
      return respose;
    }
  }
}

export type SteamNewsOptions = {
  /** AppID to retrieve news for. */
  appid: number;
  /** Maximum length for the content to return, if this is 0 the full content is returned, if it's less then a blurb is generated to fit. */
  maxlength?: number;
  /** Retrieve posts earlier than this date (unix epoch timestamp). */
  enddate?: number;
  /** Number of posts to retrieve (default 20). */
  count?: number;
  /** Comma-seperated list of feed names to return news for. */
  feeds?: string;
};

/** News for a Steam app. */
export type SteamAppNews = {
  /** The ID of the app that the news are for. */
  appid: number;
  /** The news items for the app. */
  newsitems: SteamNewsItem[];
};

/** A news item for a Steam app. */
export type SteamNewsItem = {
  /** The ID of the news item. */
  gid: number;
  /** The title of the news item. */
  title: string;
  /** The URL of the news item. */
  url: string;
  /** Determines if the URL is external. */
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
  feed_type: number;
  /** The ID of the app these news are from. */
  appid: number;
  /** The tags of this news item. */
  tags: string[];
};
