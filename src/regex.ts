export const any = '.*?';
export const some = '.+?';
export const link = `\\[(${any})\\]\\((${any})\\)`;
export const image = `!${link}`;

export const boldAsterix = `\\*\\*(${some})\\*\\*`;
export const boldUnderscore = `__(${some})__`;
export const bold = `(?:${boldAsterix})|(?:${boldUnderscore})`;

export const italicAsterix = `\\*(${some})\\*`;
export const italicUnderscore = `_(${some})_`;
export const italic = `(?:${italicAsterix})|(?:${italicUnderscore})`;

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

  /** Matches bold text sourrounded by asterixes.
   * - Group 0: The whole bold markdown
   * - Group 1: The bold text
   */
  public static boldAsterix = new RegExp(boldAsterix, 'g');
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

  /** Matches italic text sourrounded by asterixes.
   * - Group 0: The whole italic markdown
   * - Group 1: Italic text
   */
  public static italicAsterix = new RegExp(italicAsterix, 'g');
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
}
