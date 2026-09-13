import Logger from '../logger.js';
import PreProcessor from './pre_processor.js';

/** Normalizes the HTML markup of the Steam Community RSS feeds.
 *
 * Only Steam's own inventions are left here. Its heading divs, its link-host
 * spans and its reliance on blank lines are all understood directly by
 * `markup/parsers/html.ts`, which reads this HTML afterwards.
 *
 * The Steam Web API serves its news in Steam's own BBCode flavor instead, which
 * is handled by `src/steam/bbcode/`.
 */
export default class SteamProcessor extends PreProcessor {
  public static logger = new Logger('SteamProcessor');

  // <a href="https://steamcommunity.com/linkfilter/?url=https://github.com">Text</a>
  public linkFilter = /(?:(?<=")https:\/\/steamcommunity\.com\/linkfilter\/\?url=(.*?)(?="))/g;

  public process(htmlContent: string): string {
    // Point the links at where they actually go.
    return htmlContent.replace(this.linkFilter, (_, url) => url);
  }
}
