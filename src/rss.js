const Parser = require('rss-parser');

const parser = new Parser();

/** @description One item of a RSS feed. */
class Entry {
  /** @description Create a new RSS entry.
   *
   * @param {string} title - The title of the RSS entry.
   * @param {string} date - The publish date of the RSS entry.
   * @param {string} link - The URL of the RSS entry.
   * @param {string} image - The URL to the image of the RSS entry.
   * @param {string} description - The description of the RSS entry.
   */
  constructor(title, date, link, image, description) {
    this.title = title;
    this.date = date;
    this.link = link;
    this.image = image;
    this.description = description;
  }

  /** @description Returns a string representation of this RSS entry.
   *
   * @returns {string} The string representation of this RSS entry.
  */
  toString() {
    return `${this.title}\n${this.link}\n\n${this.description}`;
  }

  /** @description Print this RSS entry to the console. */
  print() {
    console.log(this.toString());
  }

  /** @description Compares two RSSEntries according to their date.
   *
   * @param {Entry} a - The first RSSEntry to compare to the second.
   * @param {Entry} b - The second RSSEntry to compare to the first.
  */
  static compare(a, b) {
    if (a.date < b.date) {
      return -1;
    } if (a.date > b.date) {
      return 1;
    }
    return 0;
  }

  /** @description Convert an item of a RSS feed to a RSS entry object.
   *
   * @param {Object} feedItem - The RSS feed item to convert to a RSSEntry.
   * @returns {Entry} The RSSEntry representation of the feed item.
  */
  static feedItemToRSSEntry(feedItem) {
    const { title } = feedItem;
    const date = new Date(feedItem.isoDate);
    const { link } = feedItem;
    const image = null;
    const { contentSnippet: description } = feedItem;

    return new Entry(title, date, link, image, description);
  }
}

/** A RSS feed. */
class Feed {
  /** @description Create a new RSS feed.
   *
   * @param {string} url - The URL to the RSS feed.
   * @param {string} message - The message to display in the bot notifications.
  */
  constructor(url, message) {
    this.url = url;
    this.message = message;
  }

  async init(date, limit) {
    await this.refresh();
    this.refreshNewEntries(date, limit);
  }

  /** @description Refresh this RSS feed. */
  async refresh() {
    this.feed = await parser.parseURL(this.url);
    this.title = this.feed.title;
  }

  /** @description Refresh the new entries of this RSS feed.
   *
   * @param {string} date - The start date to take entries from.
   * @param {number} limit - The maximum numbers of entries to take.
  */
  refreshNewEntries(date, limit) {
    const items = [];

    this.feed.items.forEach((item) => {
      const newEntry = Entry.feedItemToRSSEntry(item);

      if ((items.length < limit) && (newEntry.date > date)) {
        items.push(newEntry);
      }
    });

    this.newEntries = items;
  }

  /** @description Return a string representation of this RSS feed. */
  toString() {
    let str = `${this.title}\n-------\n-------\n\n`;

    this.newEntries.forEach((entry) => {
      str += `-------\n${entry.toString()}\n-------\n\n`;
    });

    return str;
  }

  /** @description Print this RSS feed to the console. */
  print() {
    console.log(this.toString());
  }
}

module.exports = {
  Feed,
  Entry,
};
