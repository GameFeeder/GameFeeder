/// <reference types="node" />

declare module 'feed-read_wrapper' {
  export type Feed = { name: string; source: string; link: string };

  export type Article = {
    title: string;
    author: string;
    link: string;
    content: string;
    timestamp: Date;
    feed: Feed;
  };

  export function parseURL(url: string, callback: (err: Error, articles: Article[]) => void): void;

  export function parseRSS(
    rss_string: string,
    callback: (err: Error, articles: Article[]) => void,
  ): void;

  export function parseAtom(
    atom_string: string,
    callback: (err: Error, articles: Article[]) => void,
  ): void;

  export type FeedReader = {
    parseURL(url: string, callback: (err: Error, articles: Article[]) => void): void;
    parseRSS(rss_string: string, callback: (err: Error, articles: Article[]) => void): void;
    parseAtom(atom_string: string, callback: (err: Error, articles: Article[]) => void): void;
  };
}
