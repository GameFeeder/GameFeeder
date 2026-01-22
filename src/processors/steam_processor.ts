import PreProcessor from './pre_processor.js';
import Logger from '../logger.js';

export default class SteamProcessor extends PreProcessor {
  public static logger = new Logger('SteamProcessor');

  // <span class="bb_link_host">[github.com]</span>
  public linkHostReg = /(?:<span class="bb_link_host">\[?)(.*?)(?:\]?<\/span>)/gs;
  // <div class="bb_h1">Text</div>
  public headerReg = /(?:<div class="bb_h(\d)">)(.*?)(?:<\/div>)/gs;
  // <a href="https://steamcommunity.com/linkfilter/?url=https://github.com">Text</a>
  public linkFilter = /(?:(?<=")https:\/\/steamcommunity\.com\/linkfilter\/\?url=(.*?)(?="))/g;

  // [list] ... [/list]
  public listReg = /(?:\[list\]\s*((?:(?!\[\/list\])[\s\S])*)\[\/list\])/gm;
  // [*] List item
  public listElemReg = /(?:\[\*\])\s*(.*)\s*/g;

  // [url=https://github.com]Text[/url]
  public urlTagReg = /(?:\[url=(.*?)\/?\])(.*?)(?:\/?\[\/url\/?\])/g;
  // [h1]Text[/h1]
  public headerTagReg = /(?:\[h(\d)\/?\])(.*?)(?:\/?\[\/h\d\/?\])/gs;
  // [b]Text[/b]
  public boldTagReg = /(?:\[b\/?\])(.*?)(?:\/?\[\/b\/?\])/gs;
  // [u]Text[/u]
  public underlineTagReg = /(?:\[u\/?\])(.*?)(?:\/?\[\/u\/?\])/gs;
  // [i]Text[/i]
  public italicTagReg = /(?:\[i\/?\])(.*?)(?:\/?\[\/i\/?\])/gs;
  // [strike]Text[/strike]
  public strikethroughTagReg = /(?:\[strike\/?\])(.*?)(?:\/?\[\/strike\/?\])/gs;
  // [spoiler]Text[/spoiler]
  public spoilerTagReg = /(?:\[spoiler\/?\])(.*?)(?:\/?\[\/spoiler\/?\])/gs;
  // [noparse]Text[/noparse]
  public noparseTagReg = /(?:\[noparse\/?\])(.*?)(?:\/?\[\/noparse\/?\])/gs;
  // [img]link[/img]
  public imgTagReg = /(?:\[img\])(.*?)(?:\[\/img\])/gs;
  // [previewyoutube=link][/previewyoutube]
  public youTubeTagReg = /(?:\[previewyoutube=(.*?)\])(.*?)(?:\[\/previewyoutube\])/gs;

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

    // Convert Steam formatting tags

    // Convert img tag
    newContent = newContent.replace(this.imgTagReg, (_, link: string) => {
      // Replace Steam clan image shortcut
      const url = link.replace(
        '{STEAM_CLAN_IMAGE}',
        'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans',
      );
      return `<p><img src="${url}" alt="Image"/></p>`;
    });
    // Convert YouTube preview tag
    newContent = newContent.replace(this.youTubeTagReg, (_, link: string, text: string) => {
      const alt = text || 'YouTube Video';
      return `<p><a href="https://youtu.be/${link}">${alt}</a></p>`;
    });
    // Convert noparse tag (not handled yet)
    newContent = newContent.replace(this.noparseTagReg, (_, noparseText) => {
      return `${noparseText}`;
    });
    // Convert URL tag
    newContent = newContent.replace(this.urlTagReg, (_, url, urlText) => {
      const text = urlText || 'Link';
      return `<a href="${url}">${text}</a>`;
    });
    // Convert header tag
    newContent = newContent.replace(this.headerTagReg, (_, level, headerText) => {
      const lvl = parseInt(level, 10);
      return `<h${lvl}>${headerText}</h${lvl}>`;
    });
    // Convert bold tag
    newContent = newContent.replace(this.boldTagReg, (_, boldText) => {
      return `<b>${boldText}</b>`;
    });
    // Convert underline tag
    newContent = newContent.replace(this.underlineTagReg, (_, underlinedText) => {
      return `<u>${underlinedText}</u>`;
    });
    // Convert italic tag
    newContent = newContent.replace(this.italicTagReg, (_, italicText) => {
      return `<i>${italicText}</i>`;
    });
    // Convert strikethrough tag
    newContent = newContent.replace(this.strikethroughTagReg, (_, strikeText) => {
      return `<s>${strikeText}</s>`;
    });
    // Convert spoiler tag (not handled yet)
    newContent = newContent.replace(this.spoilerTagReg, (_, spoilerText) => {
      return `${spoilerText}`;
    });

    // Convert lists
    newContent = newContent.replace(this.listReg, (_, listContent: string) => {
      // Convert list elements
      const newListContent = listContent.replace(this.listElemReg, (_match, listElement) => {
        return `<li>${listElement}</li>`;
      });

      return `<ul>${newListContent}</ul>`;
    });

    // Paragraphs and linebreaks
    newContent = newContent.replace(this.paragraphReg, '</p><p>');
    newContent = newContent.replace(this.lineBreakReg, '<br>');
    newContent = `<p>${newContent}</p>`;

    return newContent;
  }
}
