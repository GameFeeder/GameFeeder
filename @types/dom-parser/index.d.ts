/// <reference types="node" />

declare module 'dom-parser' {

  export default class DomParser {
    /**
     * Converts a DOM string to a Document.
     */
    parseFromString(domString: string): Document;
  }
}