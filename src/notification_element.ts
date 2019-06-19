export default class NotificationElement {
  public text: string;
  public link?: string;
  public icon?: string;

  constructor(text: string, link?: string, icon?: string) {
    this.text = text;
    this.link = link;
    this.icon = icon;
  }
}
