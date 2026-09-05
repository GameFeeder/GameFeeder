import Logger from '../logger.js';
import PreProcessor from './pre_processor.js';

/** Normalizes the HTML markup of the Steam Community RSS feeds.
 *
 * The Steam Web API serves its news in Steam's own BBCode flavor instead, which
 * is handled by `src/steam/bbcode/`.
 */
export default class SteamProcessor extends PreProcessor {
  public static logger = new Logger('SteamProcessor');

  // <span class="bb_link_host">[github.com]</span>
  public linkHostReg = /(?:<span class="bb_link_host">\[?)(.*?)(?:\]?<\/span>)/gs;
  // <div class="bb_h1">Text</div>
  public headerReg = /(?:<div class="bb_h(\d)">)(.*?)(?:<\/div>)/gs;
  // <a href="https://steamcommunity.com/linkfilter/?url=https://github.com">Text</a>
  public linkFilter = /(?:(?<=")https:\/\/steamcommunity\.com\/linkfilter\/\?url=(.*?)(?="))/g;

  // Paragraphs, at least one empty line
  public paragraphReg = /(\n\r?[ ]*){2,}/g;
  // Line breaks
  public lineBreakReg = /\n\r?/g;

  public process(htmlContent: string): string {
    let newContent = htmlContent;

    // Remove link hosts
    newContent = newContent.replace(this.linkHostReg, () => '');
    // Remove link filters
    newContent = newContent.replace(this.linkFilter, (_, url) => url);
    // Convert headers
    newContent = newContent.replace(this.headerReg, (_, level, headerText) => {
      const lvl = parseInt(level, 10);
      return `<h${lvl}>${headerText}</h${lvl}>`;
    });

    // Paragraphs and linebreaks
    newContent = newContent.replace(this.paragraphReg, '</p><p>');
    newContent = newContent.replace(this.lineBreakReg, '<br>');
    newContent = `<p>${newContent}</p>`;

    return newContent;
  }
}
