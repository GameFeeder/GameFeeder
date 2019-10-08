import Logger from './bot_logger';

export default class RedditUserProvider {
  public name: string;
  public titleFilter: RegExp;
  public static logger = new Logger('Reddit User');

  constructor(name: string, titleFilter?: string | RegExp) {
    this.name = name;
    if (typeof titleFilter === 'string' || titleFilter instanceof String) {
      this.titleFilter = new RegExp(titleFilter);
      RedditUserProvider.logger.debug(
        `Regex filter created from '${titleFilter}' for ${this.name}`,
      );
    } else if (titleFilter instanceof RegExp) {
      this.titleFilter = titleFilter;
      RedditUserProvider.logger.debug(
        `Filter '${titleFilter}' is already a regex for ${this.name}`,
      );
    } else {
      this.titleFilter = /.*/;
      RedditUserProvider.logger.warn(
        `Filter '${titleFilter}' for ${this.name} cannot become a regex - \
        using /.*/ instead`,
      );
    }
  }
}
