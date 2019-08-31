import botLogger from './bot_logger';

export default class RedditUserProvider {
  public name: string;
  public titleFilter: RegExp;
  private logLabel = 'reddit_user';

  constructor(name: string, titleFilter?: string | RegExp) {
    this.name = name;
    botLogger.debug(`Making filters for ${this.name}`, this.logLabel);
    if (typeof(titleFilter) === 'string' || titleFilter instanceof String) {
      this.titleFilter = new RegExp(titleFilter);
      botLogger.debug(`Regex filter created from ${titleFilter}`, this.logLabel);
    } else if (titleFilter instanceof RegExp) {
      this.titleFilter = titleFilter;
      botLogger.debug(`Filter ${titleFilter} is already a regex`, this.logLabel);
    } else {
      this.titleFilter = /.*/;
      botLogger.warn(`Filter ${titleFilter} cannot become a regex - \
        using /.*/ instead`, this.logLabel);
    }
  }
}
