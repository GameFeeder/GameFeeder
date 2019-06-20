export const any = '.*?';
export const some = '.+?';
export const link = `\\[(${any})\\]\\((${any})\\)`;
export const image = `!${link}`;

export const boldAsterisk = `\\*\\*(${some})\\*\\*`;
export const boldUnderscore = `__(${some})__`;
export const bold = `(?:${boldAsterisk})|(?:${boldUnderscore})`;

export const italicAsterisk = `(?<!\\*)\\*([^\\*]+)\\*(?!\\*)`;
export const italicUnderscore = `(?<!_)_([^_]+)_(?!_)`;
export const italic = `(?:${italicAsterisk})|(?:${italicUnderscore})`;

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
}
