import RSSParser from 'rss-parser';
import { URL } from 'url';
import { Game } from './game';
import BotNotification from './notification';
import BlogProvider from './provider_blog';
import RedditProvider from './provider_reddit';

export default class RSS {
  private parser: any;
  private newEntries: object;

  constructor() {
    this.parser = new RSSParser();
  }

  public getGameNotifications(game: Game, date?: Date, limit?: number): BotNotification[] {
    const notifications: BotNotification[] = [];

    for (const provider of game.providers) {
      const feed = this.parser.parseURL(provider.url);

      for (const item of feed.items) {
        const { title, link, contentSnippet: description } = item;
        const timestamp = new Date(item.isoDate);
        let message = '';
        let author = '';
        const color = 'FFFFFF';
        const thumbnail = new URL('');
        const image = new URL('');
        const footer = '';

        if (provider instanceof RedditProvider) {
          message = `New post by ${provider.username}!`;
          author = provider.username;
        } else if (provider instanceof BlogProvider) {
          message = `New ${provider.label} blog post!`;
          author = provider.label;
        } else {
          message = 'News!';
        }

        const notification = new BotNotification(message, game, title, link, author, color,
          description, thumbnail, image, timestamp, footer);

        if ((date && (notification.timestamp < date)) || (limit && (notifications.length >= limit))) {
          break;
        }
        notifications.push(notification);
      }
    }
    // Sort the notifications by their date, from old to new.
    notifications.sort((a, b) => {
      return a.compare(b);
    });
    return notifications;
  }
}
