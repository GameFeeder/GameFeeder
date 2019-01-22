/// <reference types="node" />

declare module 'feed-read' {

  export type Feed = {name: string, source: string, link: string};

  export type Article = {title: string, author: string, link: string, content: string, timestamp: Date, feed: Feed};

  export function feed(url: string, callback: (err: Error, articles: Article[]) => void): void;
}