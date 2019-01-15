export default class Provider {
  public url: string;
  public label: string;

  constructor(url: string, label: string) {
    this.url = `${url}.rss`;
    this.label = label;
  }
}
