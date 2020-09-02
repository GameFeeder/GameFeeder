import axios from 'axios';
import Logger from '../logger';
import SteamAppNews, { SteamAppNewsResponse } from './steam_app_news';

/** A wrapper around the Steam Web API.
 *
 * Documentation: https://partner.steamgames.com/doc/webapi_overview
 */
export default class SteamWebAPI {
  public static logger = new Logger('SteamWebAPI');
  public static instance = axios.create({
    baseURL: 'https://api.steampowered.com/',
    timeout: 5000,
    responseType: 'json',
  });

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

    try {
      // TODO: Fix that the formatting is currently lost when retrieving the content of the post
      const response = await this.instance.get('ISteamNews/GetNewsForApp/v2/', {
        params: newsOptions,
      });

      return new SteamAppNews(response.data);
    } catch (error) {
      this.logger.error(`Failed to get news for app ${appid}:\n${error}`);
      // Return empty news
      const respose: SteamAppNewsResponse = { appnews: { appid, newsitems: [], count: 0 } };
      return new SteamAppNews(respose);
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
