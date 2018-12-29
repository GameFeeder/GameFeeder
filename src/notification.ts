class BotNotification {
  public text: string;

  public title: string;
  public url: URL;
  public author: string;
  public color: string;
  public description: string;
  public thumbnail: URL;
  public image: URL;
  public timestamp: Date;
  public footer: string;

  constructor(text: string, title: string, url: URL, author: string, color: string, description: string,
              thumbnail: URL, image: URL, timestamp: Date, footer: string) {
      this.text = text;
      this.title = title;
      this.url = url;
      this.author = author;
      this.color = color;
      this.description = description;
      this.thumbnail = thumbnail;
      this.image = image;
      this.timestamp = timestamp;
      this.footer = footer;
    }
}
