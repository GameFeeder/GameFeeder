/// <reference types="node" />

declare module 'turndown' {

  export default class TurndownService {
    /** Converts a HTML string to a Markdown string.
     * 
     * @param htmlText - The HTML text to parse to Markdown.
     * @returns The converted Markdown string.
     */
    turndown(htmlText: string): string;
  }
}