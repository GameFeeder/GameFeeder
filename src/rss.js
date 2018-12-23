const Parser = require('rss-parser');

const parser = new Parser();

/** One item of a RSS feed. */
class RSSEntry {
  /** Create a new RSS entry. */
  constructor(title, date, link, image, description) {
    this.title = title;
    this.date = date;
    this.link = link;
    this.image = image;
    this.description = description;
  }

  /** Returns a string representation of this RSS entry. */
  toString() {
    return `${this.title}\n${this.link}\n\n${this.description}`;
  }

  /** Print this RSS entry to the console. */
  print() {
    console.log(this.toString());
  }

  /** Compare two RSSEntries according to their date. */
  static compare(a, b) {
    if (a.date < b.date) {
      return -1;
    } if (a.date > b.date) {
      return 1;
    }
    return 0;
  }

  /** Convert an item of a RSS feed to a RSS entry object. */
  static feedItemToRSSEntry(feedItem) {
    const { title } = feedItem;
    const date = new Date(feedItem.isoDate);
    const { link } = feedItem;
    const image = null;
    const { contentSnippet: description } = feedItem;

    return new RSSEntry(title, date, link, image, description);
  }
}

/** A RSS feed. */
class RSSFeed {
  /** Create a new RSS feed. */
  constructor(url, message) {
    this.url = url;
    this.message = message;
  }

  async init(date, limit) {
    await this.refresh();
    this.refreshNewEntries(date, limit);
  }

  /** Refresh this RSS feed. */
  async refresh() {
    this.feed = await parser.parseURL(this.url);
    this.title = this.feed.title;
  }

  /** Refresh the new entries of this RSS feed. */
  refreshNewEntries(date, limit) {
    const items = [];

    this.feed.items.forEach((item) => {
      const newEntry = RSSEntry.feedItemToRSSEntry(item);

      if ((items.length < limit) && (newEntry.date > date)) {
        items.push(newEntry);
      }
    });

    this.newEntries = items;
  }

  /** Return a string representation of this RSS feed. */
  toString() {
    let str = `${this.title}\n-------\n-------\n\n`;

    this.newEntries.forEach((entry) => {
      str += `-------\n${entry.toString()}\n-------\n\n`;
    });

    return str;
  }

  /** Print this RSS feed to the console. */
  print() {
    console.log(this.toString());
  }
}


(async () => {
  const feed = new RSSFeed('http://blog.dota2.com/feed/', 'New analysis by /u/Magesnunite!');

  await feed.init(new Date('2018-12-18'), 5);
  feed.print();
})();
