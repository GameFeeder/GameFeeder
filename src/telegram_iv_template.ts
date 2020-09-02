/** A representation of a Telegram IV template. */
export default class TelegramIVTemplate {
  /** Creates a new Telegram IV template.
   *
   * @param domain - The domain of the Telegram IV template.
   * @param templateHash - The hash of the Telegram IV template.
   */
  constructor(public domain: string, public templateHash: string) {}

  /** Gets the instant view URL from the URL.
   *
   * @param url - The URL to get the IV URL for.
   */
  public getIVUrl(url: string): string {
    return `https://t.me/iv?url=${url}&rhash=${this.templateHash}`;
  }

  /** Determines if the IV template should be applied to the given URL.
   *
   * @param url - The URL to test the IV template with.
   */
  public testUrl(url?: string): string {
    if (url?.includes(this.domain)) {
      return this.getIVUrl(url);
    }
    return '';
  }

  /** Gets the IV URL if the template applies, otherwise the normal URL.
   *
   * @param url - The URL to test the IV template with.
   */
  public getLinkUrl(url: string): string {
    return this.testUrl(url) || url;
  }
}
