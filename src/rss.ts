import RSSParser from 'rss-parser';
import { URL } from 'url';
import { Game } from './game';
import botLogger from './logger';
import BotNotification from './notification';
import BlogProvider from './provider_blog';
import RedditProvider from './provider_reddit';

export default class RSS {
  private parser: any;
  private newEntries: object;

  constructor() {
    this.parser = new RSSParser();
  }

  public async getGameNotifications(game: Game, date?: Date, limit?: number): Promise<BotNotification[]> {
    const notifications: BotNotification[] = [];

    for (const provider of game.providers) {
      try {
        // const feed = await this.parse.parseURL(provider.url);
        const feed = await this.parser.parseURL(provider.url);

        for (const item of feed.items) {
          const { title, link, contentSnippet: description } = item;
          const timestamp = new Date(item.isoDate);
          let message = '';
          let author = '';
          const color = game.color;
          const thumbnail = game.icon;
          const image = '';
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

          if ((date && (notification.timestamp <= date)) || (limit && (notifications.length >= limit))) {
            break;
          }
          notifications.push(notification);
        }
      } catch (error) {
        botLogger.error(`Failed to parse URL: '${provider.url}'\n${error}`, 'RSS');
      }
    }
    // Sort the notifications by their date, from old to new.
    notifications.sort((a, b) => {
      return a.compare(b);
    });
    return notifications;
  }
}
