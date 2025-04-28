import Comparable from '../util/comparable.js';

export default class RSSItem implements Comparable<RSSItem> {
  /**
   * Creates an instance of RSSItem.
   * @param title RSS item title
   * @param author RSS item author
   * @param link RSS item source url
   * @param content RSS item body
   * @param timestamp RSS item timestamp
   * @param feed RSS item source feed
   */
  constructor(
    public title: string,
    public author: string,
    public link: string,
    public content: string,
    public timestamp: Date,
    public feed: { name?: string; source?: string; link?: string },
  ) {}

  public compareTo(other: RSSItem): -1 | 0 | 1 {
    if (this.timestamp < other.timestamp) {
      return -1;
    }
    if (this.timestamp > other.timestamp) {
      return 1;
    }
    return 0;
  }
}
