import Comparable from '../util/comparable';

export default class RSSItem implements Comparable<RSSItem> {
  public title: string;
  public author: string;
  public link: string;
  public content: string;
  public timestamp: Date;
  public feed: { name: string; source: string; link: string };

  constructor(
    title: string,
    author: string,
    link: string,
    content: string,
    timestamp: Date,
    feed: { name: string; source: string; link: string },
  ) {
    this.title = title;
    this.author = author;
    this.link = link;
    this.content = content;
    this.timestamp = timestamp;
    this.feed = feed;
  }

  public compareTo(other: RSSItem) {
    if (this.timestamp < other.timestamp) {
      return -1;
    }
    if (this.timestamp > other.timestamp) {
      return 1;
    }
    return 0;
  }
}
