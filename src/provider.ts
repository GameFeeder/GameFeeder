import { URL } from 'url';

export default class Provider {
  public url: URL;
  public label: string;

  constructor(url: URL, label: string) {
    this.url = url;
    this.label = label;
  }
}
