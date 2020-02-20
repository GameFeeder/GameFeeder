export const any = '.*?';
export const some = '.+?';
export const someNoAstNoLB = '[^\\*\\n]+?';
export const someNoUndNoLB = '[^_\\n]+?';
export const someNoHash = '[^#]+?';
export const anyWs = '\\s*';
export const someWs = '\\s+';

// A simulation of the ^ character outside the multiline mode
export const lineStart = `(?<!.)`;
// A simulation of the $ character outside the multiline mode
export const lineEnd = `(?!.)`;

/** Parenthesis left  */
export const pl = '\\(';
/** Parenthesis right  */
export const pr = '\\)';
/** Square bracket left */
export const bl = '\\[';
/** Square bracket right */
export const br = '\\]';

export const baseLink = `${bl}(?!${bl})(${any})${br}${pl}(${any})${pr}`;
export const link = `(?<!!)(?<!${bl})${baseLink}`;
export const baseImage = `!${baseLink}`;
export const image = `(?<!${bl})${baseImage}`;
// export const imageLink = `!\\[(?:(?:\\[(.*?)\\]\\((.*?)\\))|(.*?))\\]\\((.*)\\)`;
export const imageLink = `(?<!${bl})!${bl}(?:(?:${baseLink})|(${any}))${br}${pl}(${any})${pr}`;
// (?<!(?:!\\[))(?<!!)\\[(?:(?:!\\[(?!\\[)(.*?)\\]\\((.*?)\\))|(.*?))\\]\\((.*?)\\)
export const linkImage = `(?<!(?:!${bl}))(?<!!)${bl}(?:(?:${baseImage})|(${any}))${br}${pl}(${any})${pr}`;

export const boldAsterisk = `\\*\\*(?!\\s)(${some})(?<!\\s)\\*\\*`;
export const boldUnderscore = `__(?!\\s)(${some})(?<!\\s)__`;
export const bold = `(?:${boldAsterisk})|(?:${boldUnderscore})`;

export const italicAsterisk = `(?<!\\*)\\*(?!\\s)(${someNoAstNoLB})(?<!\\s)\\*(?!\\*)`;
export const italicUnderscore = `(?<!_)_(?!\\s)(${someNoUndNoLB})(?<!\\s)_(?!_)`;
export const italic = `(?:${italicAsterisk})|(?:${italicUnderscore})`;

export const list = `^${anyWs}[-\\*]${someWs}(${any})${anyWs}$`;

export const hBase = `${anyWs}(${some})${anyWs}#*${anyWs}`;
export const hAny = `${anyWs}${lineStart}(#{1,6})${hBase}${lineEnd}${anyWs}`;
export const h1 = `${anyWs}${lineStart}#${hBase}${lineEnd}${anyWs}`;
export const h2 = `${anyWs}${lineStart}##${hBase}${lineEnd}${anyWs}`;
export const h3 = `${anyWs}${lineStart}###${hBase}${lineEnd}${anyWs}`;
export const h4 = `${anyWs}${lineStart}####${hBase}${lineEnd}${anyWs}`;
export const h5 = `${anyWs}${lineStart}#####${hBase}${lineEnd}${anyWs}`;
export const h6 = `${anyWs}${lineStart}######${hBase}${lineEnd}${anyWs}`;

export const h1Alt = `(?:${anyWs})(${some})(?:[ \t\f\v\r]*\n={3,}${anyWs})`;
export const h2Alt = `(?:${anyWs})(${some})(?:[ \t\f\v\r]*\n-{3,}${anyWs})`;

export const quote = `^>${anyWs}(${any})${anyWs}$`;

export const separator = `${anyWs}\n${anyWs}((?:-{3,})|(?:\\*{3,}))${anyWs}`;

export default class MDRegex {
  // Links

  /** Matches a markdown link.
   * - Group 0: The whole markdown link
   * - Group 1: The link label
   * - Group 2: The link URL
   */
  public static link = new RegExp(link, 'g');

  /** Matches a markdown image.
   * - Group 0: The whole markdown image
   * - Group 1: The image label
   * - Group 2: The image URL
   */
  public static image = new RegExp(image, 'g');

  /** Matches a markdown image with optional included link.
   * - Group 0: The whole markdown image link
   * - Group 4: The image url
   *
   * If there is a link:
   * - Group 1: The link label
   * - Group 2: The link url
   *
   * If there is no link:
   * - Group 3: The image label
   */
  public static imageLink = new RegExp(imageLink, 'g');

  /** Matches a markdown link with optional included image.
   * - Group 0: The whole markdown link image
   * - Group 4: The link url
   *
   * If there is an image:
   * - Group 1: The image label
   * - Group 2: The image url
   *
   * If there is no image:
   * - Group 3: The link label
   */
  public static linkImage = new RegExp(linkImage, 'g');

  // Bold

  /** Matches bold text sourrounded by asterisks.
   * - Group 0: The whole bold markdown
   * - Group 1: The bold text
   */
  public static boldAsterisk = new RegExp(boldAsterisk, 'g');

  /** Matches bold text sourrounded by underscores.
   * - Group 0: The whole bold markdown
   * - Group 1: The bold text
   */
  public static boldUnderscore = new RegExp(boldUnderscore, 'g');

  /** Matches bold text.
   * - Group 0: The whole bold markdown
   *
   * If it's asterix markdown:
   * - Group 1: The bold text
   *
   * If it's underscore markdown:
   * - Group 2: The bold text
   */
  public static bold = new RegExp(bold);

  // Italic

  /** Matches italic text sourrounded by asterisks.
   * - Group 0: The whole italic markdown
   * - Group 1: Italic text
   */
  public static italicAsterisk = new RegExp(italicAsterisk, 'g');

  /** Matches  text sourrounded by underscores.
   * - Group 0: The whole italic markdown
   * - Group 1: Italic text
   */
  public static italicUnderscore = new RegExp(italicUnderscore, 'g');

  /** Matches italic text.
   * - Group 0: The whole italic markdown
   *
   * If it's asterix markdown:
   * - Group 1: The italic text
   *
   * If it's underscore markdown:
   * - Group 2: The italic text
   */
  public static italic = new RegExp(italic);

  // Multiline

  /** Matches a list element.
   * - Group 0: The whole list markdown
   * - Group 1: The list element
   */
  public static list = new RegExp(list, 'gm');

  public static hAny = new RegExp(hAny, 'g');
  public static h1 = new RegExp(h1, 'g');
  public static h1Alt = new RegExp(h1Alt, 'g');
  public static h2 = new RegExp(h2, 'g');
  public static h2Alt = new RegExp(h2Alt, 'g');
  public static h3 = new RegExp(h3, 'g');
  public static h4 = new RegExp(h4, 'g');
  public static h5 = new RegExp(h5, 'g');
  public static h6 = new RegExp(h6, 'g');

  public static quote = new RegExp(quote, 'gm');

  public static separator = new RegExp(separator, 'g');

  // Functions

  /** Replaces links in the markdown text with the given function.
   *
   * @param text - The text to replace links in.
   * @param replaceFn - The function to replace the links with.
   */
  public static replaceLink(
    text: string,
    replaceFn: (match: string, label: string, url: string) => string,
  ): string {
    return text.replace(MDRegex.link, (match, label, url) => {
      return replaceFn(match, label, url);
    });
  }

  /** Replaces images in the markdown text with the given function.
   *
   * @param text - The text to replace links in.
   * @param replaceFn - The function to replace the links with.
   */
  public static replaceImage(
    text: string,
    replaceFn: (match: string, label: string, url: string) => string,
  ): string {
    return text.replace(MDRegex.image, (match, label, url) => {
      return replaceFn(match, label, url);
    });
  }

  /** Replaces image links in the markdown text with the given function.
   *
   * @param text - The text to replace image links in.
   * @param replaceFn - The function to replace the image links with.
   */
  public static replaceImageLink(
    text: string,
    replaceFn: (match: string, label: string, imageUrl: string, linkUrl: string) => string,
  ): string {
    return text.replace(MDRegex.imageLink, (match, linkLabel, linkUrl, imageLabel, imageUrl) => {
      return replaceFn(match, linkLabel || imageLabel, imageUrl, linkUrl);
    });
  }

  /** Replaces link images in the markdown text with the given function.
   *
   * @param text - The text to replace link images in.
   * @param replaceFn - The function to replace the link images with.
   */
  public static replaceLinkImage(
    text: string,
    replaceFn: (match: string, label: string, linkUrl: string, imageUrl: string) => string,
  ): string {
    return text.replace(MDRegex.linkImage, (match, imageLabel, imageUrl, linkLabel, linkUrl) => {
      return replaceFn(match, imageLabel || linkLabel, linkUrl, imageUrl);
    });
  }

  /** Replaces bold text in the markdown text with the given function.
   *
   * @param text - The text to replace bold text in.
   * @param replaceFn - The function to replace the bold text with.
   */
  public static replaceBold(
    text: string,
    replaceFn: (match: string, boldText: string) => string,
  ): string {
    let newText = text.replace(MDRegex.boldAsterisk, (match, boldText) => {
      return replaceFn(match, boldText);
    });
    newText = newText.replace(MDRegex.boldUnderscore, (match, boldText) => {
      return replaceFn(match, boldText);
    });
    return newText;
  }

  /** Replaces italic text in the markdown text with the given function.
   *
   * @param text - The text to replace.
   * @param replaceFn - The function to replace the text with.
   */
  public static replaceItalic(
    text: string,
    replaceFn: (match: string, italicText: string) => string,
  ): string {
    let newText = text.replace(MDRegex.italicAsterisk, (match, italicText) => {
      return replaceFn(match, italicText);
    });
    newText = newText.replace(MDRegex.italicUnderscore, (match, italicText) => {
      return replaceFn(match, italicText);
    });
    return newText;
  }

  /** Replaces markdown lists with the given function.
   *
   * @param text - The text to replace.
   * @param replaceFn - The function to replace the text with.
   */
  public static replaceList(
    text: string,
    replaceFn: (match: string, listElement: string) => string,
  ): string {
    return text.replace(MDRegex.list, (match, listElement) => {
      return replaceFn(match, listElement);
    });
  }

  /** Replaces markdown headers with the given function.
   *
   * @param text - The text to replace.
   * @param replaceFn - The function to replace the text with.
   */
  public static replaceHeader(
    text: string,
    replaceFn: (match: string, headerText: string, level: number) => string,
  ): string {
    // Default headers
    let newText = text.replace(MDRegex.hAny, (match, hashes, headerText) => {
      const level = hashes.length;
      return replaceFn(match, headerText, level);
    });
    // Alternative headers
    newText = newText.replace(MDRegex.h1Alt, (match, headerText) => {
      return replaceFn(match, headerText, 1);
    });
    newText = newText.replace(MDRegex.h2Alt, (match, headerText) => {
      return replaceFn(match, headerText, 2);
    });
    return newText;
  }

  /** Replaces markdown blockquotes with the given function.
   *
   * @param text - The text to replace quotes in.
   * @param replaceFn - The function to replace the quotes with.
   */
  public static replaceQuote(
    text: string,
    replaceFn: (match: string, quoteText: string) => string,
  ): string {
    return text.replace(MDRegex.quote, (match, quoteText) => {
      return replaceFn(match, quoteText);
    });
  }

  /** Replace markdown separators with the given function
   *
   * @param text - The text to replace separators in.
   * @param replaceFn - The function to replace the separators with.
   */
  public static replaceSeparator(
    text: string,
    replaceFn: (match: string, separator: string) => string,
  ): string {
    return text.replace(MDRegex.separator, (match, mdSeparator) => {
      return replaceFn(match, mdSeparator);
    });
  }
}
