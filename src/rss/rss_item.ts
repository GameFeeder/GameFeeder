import Comparable from '../util/comparable';

export default class RSSItem implements Comparable<RSSItem> {
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
