export const any = '(.*)';
export const some = '(.+)';
export const link = `\\[${any}\\]\\(${any}\\)`;
export const image = `!${link}`;
export const bold = `(\\*\\*${some}\\*\\*)|(__${some}__)`;

export default class MDRegex {
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
  /** Matches bold text.
   * - Group 1: Bold text
   */
  public static bold = new RegExp(bold);
}
