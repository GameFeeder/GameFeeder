import { URL } from 'url';
import Provider from './provider';

export default class BlogProvider extends Provider {
  constructor(url: URL, label: string) {
    super(url, label);
  }
}
