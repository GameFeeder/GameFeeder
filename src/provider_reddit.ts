import Provider from './provider';

export default class RedditProvider extends Provider {
  public username: string;

  constructor(username: string) {
    super(`https://www.reddit.com/user/${username}`, `/u/${username}`);
    this.username = username;
  }
}
