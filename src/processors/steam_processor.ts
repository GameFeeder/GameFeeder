import PreProcessor from './pre_processor';
import Logger from '../logger';

export default class SteamProcessor extends PreProcessor {
  public static logger = new Logger('SteamProcessor');

  // <span class="bb_link_host">[github.com]</span>
  public linkHostReg = /(?:<span class="bb_link_host">\[?)(.*?)(?:\]?<\/span>)/g;
  // <div class="bb_h1">Text</div>
  public headerReg = /(?:<div class="bb_h(\d)">)(.*?)(?:<\/div>)/g;
  // <a href="https://steamcommunity.com/linkfilter/?url=https://github.com">Text</a>
  public linkFilter = /(?:(?<=")https:\/\/steamcommunity\.com\/linkfilter\/\?url=(.*?)(?="))/g;

  // [list] ... [/list]
  public listReg = /(?:\[list\]\s*((?:.|\s)*?)\[\/list\])/gm;
  // [*] List item
  public listElemReg = /(?:\[\*\])\s*(.*?)\s*\n/g;

  // [url=https://github.com]Text[/url]
  public urlTagReg = /(?:\[url=(.*?)\/?\])(.*?)(?:\/?\[\/url\/?\])/g;
  // [h1]Text[/h1]
  public headerTagReg = /(?:\[h(\d)\/?\])(.*?)(?:\/?\[\/h\d\/?\])/g;
  // [b]Text[/b]
  public boldTagReg = /(?:\[b\/?\])(.*?)(?:\/?\[\/b\/?\])/g;
  // [u]Text[/u]
  public underlineTagReg = /(?:\[u\/?\])(.*?)(?:\/?\[\/u\/?\])/g;
  // [i]Text[/i]
  public italicTagReg = /(?:\[i\/?\])(.*?)(?:\/?\[\/i\/?\])/g;
  // [strike]Text[/strike]
  public strikethroughTagReg = /(?:\[strike\/?\])(.*?)(?:\/?\[\/strike\/?\])/g;
  // [spoiler]Text[/spoiler]
  public spoilerTagReg = /(?:\[spoiler\/?\])(.*?)(?:\/?\[\/spoiler\/?\])/g;
  // [noparse]Text[/noparse]
  public noparseTagReg = /(?:\[noparse\/?\])(.*?)(?:\/?\[\/noparse\/?\])/g;
  // [img]link[/img]
  public imgTagReg = /(?:\[img\])(.*?)(?:\[\/img\])/g;

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
    // Convert noparse tag (not handled yet)
    newContent = newContent.replace(this.noparseTagReg, (_, noparseText) => {
      return `${noparseText}`;
    });
    // Convert URL tag
    newContent = newContent.replace(this.urlTagReg, (_, url, urlText) => {
      return `<a href="${url}">${urlText}</a>`;
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

    return newContent;
  }
}
