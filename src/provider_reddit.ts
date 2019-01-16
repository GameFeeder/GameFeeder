import Provider from './provider';

export default class RedditProvider extends Provider {
  public username: string;
  public subreddit: string;

  constructor(username: string, subreddit: string) {
    super(`https://www.reddit.com/user/${username}/posts/`, `/u/${username}`);
    this.username = username;
    this.subreddit = subreddit;
  }
}
