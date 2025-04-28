import fetch from 'node-fetch';
import { URL, URLSearchParams } from 'url';
import Logger from '../logger.js';
import SteamAppNews, { SteamAppNewsResponse } from './steam_app_news.js';

/** The timeout duration in ms for all API requests. */
const REQUEST_TIMEOUT = 10000;

export type SteamNewsOptions = {
  /** AppID to retrieve news for. */
  appid: string;
  /** Maximum length for the content to return, if this is 0 the full content is returned, if it's less then a blurb is generated to fit. */
  maxlength?: string;
  /** Retrieve posts earlier than this date (unix epoch timestamp). */
  enddate?: string;
  /** Number of posts to retrieve (default 20). */
  count?: string;
  /** Comma-seperated list of feed names to return news for. */
  feeds?: string;
};

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
    enddate = new Date(),
    count?: number,
    feeds?: string[],
  ): Promise<SteamAppNews> {
    const newsOptions: SteamNewsOptions = {
      appid: appid.toString(),
      count: count?.toString(),
      // maxlength: maxlength?.toString(),
      // Convert to Unix timestamp
      enddate: (enddate.valueOf() / 1000).toString(),
      // Convert to single string
      feeds: feeds ? feeds.join(',') : undefined,
    };

    try {
      // TODO: Fix that the formatting is currently lost when retrieving the content of the post
      const uri = new URL('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/');
      const params = new URLSearchParams(newsOptions);
      uri.search = params.toString();

      const response = await fetch(uri.toString(), {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
      const responseJSON = await response.json();

      return new SteamAppNews(responseJSON as SteamAppNewsResponse);
    } catch (error) {
      this.logger.error(`Failed to get news for app ${appid}:\n${error}`);
      // Return empty news
      const respose: SteamAppNewsResponse = { appnews: { appid, newsitems: [], count: 0 } };
      return new SteamAppNews(respose);
    }
  }
}
