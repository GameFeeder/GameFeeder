export const any = '(.*)';
export const some = '(.+)';
export const link = `\\[${any}\\]\\(${any}\\)`;
export const image = `!${link}`;

export const boldAsterix = `\\*\\*${some}\\*\\*`;
export const boldUnderscore = `__${some}__`;
export const bold = `(${boldAsterix})|(${boldUnderscore})`;

export const italicAsterix = `\\*${some}\\*`;
export const italicUnderscore = `_${some}_`;
export const italic = `(${italicAsterix})|(${italicUnderscore})`;

export default class MDRegex {

  // Links

  /** Matches a markdown link.
   * - Group 1: Link label
   * - Group 2: Link URL
   */
  public static link = new RegExp(link);
  /** Matches a markdown image.
   * - Group 1: Image label
   * - Group 2: Image URL
   */
  public static image = new RegExp(image);

  // Bold

  /** Matches bold text sourrounded by asterixes.
   * - Group 1: Bold text
   */
  public static boldAsterix = new RegExp(boldAsterix);
  /** Matches bold text sourrounded by underscores.
   * - Group 1: Bold text
   */
  public static boldUnderscore = new RegExp(boldUnderscore);
  /** Matches bold text.
   * - Group 1: Bold text
   */
  public static bold = new RegExp(bold);

  // Italic

  /** Matches italic text sourrounded by asterixes.
   * - Group 1: Italic text
   */
  public static italicAsterix = new RegExp(italicAsterix);
  /** Matches  text sourrounded by underscores.
   * - Group 1: Italic text
   */
  public static italicUnderscore = new RegExp(italicUnderscore);
  /** Matches italic text.
   * - Group 1: italic text
   */
  public static italic = new RegExp(italic);
}
