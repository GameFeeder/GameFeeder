export default class RedditUserProvider {
  public name: string;
  public titleFilter: RegExp;

  constructor(name: string, titleFilter?: string | RegExp) {
    this.name = name;
    if (titleFilter instanceof String) {
      this.titleFilter = new RegExp(titleFilter);
    } else if (titleFilter instanceof RegExp) {
      this.titleFilter = titleFilter;
    } else {
      this.titleFilter = /.*/;
    }
  }
}
