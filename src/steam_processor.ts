import PreProcessor from './pre_processor';
import Logger from './bot_logger';

export default class SteamProcessor extends PreProcessor {
  public static logger = new Logger('SteamProcessor');

  public linkHostReg = /(?:<span class="bb_link_host">\[?)(.*?)(?:\]?<\/span>)/g;
  public headerReg = /(?:<div class="bb_h(\d)">)(.*?)(?:<\/div>)/g;
  public linkFilter = /(?:(?<=")https:\/\/steamcommunity\.com\/linkfilter\/\?url=(.*?)(?="))/g;

  public urlTagReg = /(?:\[url=(.*?)\/?\])(.*?)(?:\/?\[\/url\/?\])/g;
  public headerTagReg = /(?:\[h(\d)\/?\])(.*?)(?:\/?\[\/h\d\/?\])/g;
  public boldTagReg = /(?:\[b\/?\])(.*?)(?:\/?\[\/b\/?\])/g;
  public underlineTagReg = /(?:\[u\/?\])(.*?)(?:\/?\[\/u\/?\])/g;
  public italicTagReg = /(?:\[i\/?\])(.*?)(?:\/?\[\/i\/?\])/g;
  public strikethroughTagReg = /(?:\[strike\/?\])(.*?)(?:\/?\[\/strike\/?\])/g;
  public spoilerTagReg = /(?:\[spoiler\/?\])(.*?)(?:\/?\[\/spoiler\/?\])/g;
  public noparseTagReg = /(?:\[noparse\/?\])(.*?)(?:\/?\[\/noparse\/?\])/g;

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

    return newContent;
  }
}
