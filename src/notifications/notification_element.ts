export default class NotificationElement {
  /**
   * Creates an instance of a NotificationElement.
   * @param text The body of the notification element
   * @param link The source of the notification element
   * @param icon The icon of the notification element
   */
  constructor(
    public text: string,
    public link?: string,
    public icon?: string,
  ) {}
}
