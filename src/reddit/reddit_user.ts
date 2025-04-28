import Logger from '../logger.js';

export default class RedditUserProvider {
  public titleFilter: RegExp;
  public static logger = new Logger('Reddit User');

  /**
   * Creates an instance of RedditUserProvider.
   * @param name Reddit username
   * @param titleFilter Used on post titles to only accept updates
   */
  constructor(
    public name: string,
    titleFilter?: string | RegExp,
  ) {
    if (typeof titleFilter === 'string' || titleFilter instanceof String) {
      this.titleFilter = new RegExp(titleFilter);
    } else if (titleFilter instanceof RegExp) {
      this.titleFilter = titleFilter;
    } else {
      this.titleFilter = /.*/;
      RedditUserProvider.logger.warn(
        `Filter '${titleFilter}' for ${this.name} cannot become a regex - \
        using /.*/ instead`,
      );
    }
  }
}
