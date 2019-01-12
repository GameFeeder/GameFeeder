import { URL } from 'url';
import Provider from './provider';

export default class RedditProvider extends Provider {
  public username: string;

  constructor(username: string) {
    super(new URL(`/user/${username}`, 'https://www.reddit.com'), `/u/${username}`);
    this.username = username;
  }
}
