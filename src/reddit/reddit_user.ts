import Logger from '../logger';

export default class RedditUserProvider {
  public name: string;
  public titleFilter: RegExp;
  public static logger = new Logger('Reddit User');

  constructor(name: string, titleFilter?: string | RegExp) {
    this.name = name;
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
