import PreProcessor from './pre_processor';

export default class SteamProcessor extends PreProcessor {
  private linkHostReg = /(?:<span class="bb_link_host">\[?)(.*?)(?:\[<\/span>)/g;
  private headerReg = /(?:<div class="bb_h(\d)">)(.*?)(?:<\/div>)/g;

  private urlTagReg = /(?:\[url=(.*?)\/?\])(.*?)(?:\/?\[\/url\/?\])/g;
  private headerTagReg = /(?:\[h(\d)\/?\])(.*?)(?:\/?\[\/h\d\/?\])/g;
  private boldTagReg = /(?:\[b\/?\])(.*?)(?:\/?\[\/b\/?\])/g;
  private underlineTagReg = /(?:\[u\/?\])(.*?)(?:\/?\[\/u\/?\])/g;
  private italicTagReg = /(?:\[i\/?\])(.*?)(?:\/?\[\/i\/?\])/g;
  private strikethroughTagReg = /(?:\[strike\/?\])(.*?)(?:\/?\[\/strike\/?\])/g;
  private spoilerTagReg = /(?:\[spoiler\/?\])(.*?)(?:\/?\[\/spoiler\/?\])/g;
  private noparseTagReg = /(?:\[noparse\/?\])(.*?)(?:\/?\[\/noparse\/?\])/g;

  public process(htmlContent: string): string {
    let newContent = htmlContent;

    // Remove link hosts
    newContent = newContent.replace(this.linkHostReg, () => '');
    // Convert headers
    newContent = newContent.replace(this.headerReg, (_, level, headerText) => {
      return `<h${level}>${headerText}</h${level}>`;
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
      return `<h${level}>${headerText}</h${level}>`;
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
