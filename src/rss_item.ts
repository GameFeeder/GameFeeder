export default class RSSItem {
  public title: string;
  public author: string;
  public link: string;
  public content: string;
  public timestamp: Date;
  public feed: {name: string, source: string, link: string};

  constructor(title: string, author: string, link: string, content: string, timestamp: Date,
              feed: {name: string, source: string, link: string}) {
    this.title = title;
    this.author = author;
    this.link = link;
    this.content = content;
    this.timestamp = timestamp;
    this.feed = feed;
  }

  public compare(b: RSSItem) {
    if (this.timestamp < b.timestamp) {
      return -1;
    } else if (this.timestamp > b.timestamp) {
      return 1;
    } else {
      return 0;
    }
  }
}
