import type { MarkdownRenderOptions } from './markdown_renderer.js';
import renderMarkdown from './markdown_renderer.js';
import type { ParseOptions } from './parser.js';
import parse from './parser.js';

export type BBCodeToMarkdownOptions = ParseOptions & MarkdownRenderOptions;

/** Converts the BBCode of a Steam news post to markdown.
 *
 * @param input - The raw `contents` of a Steam news item.
 * @param options - Parsing and rendering overrides.
 */
export default function bbcodeToMarkdown(
  input: string,
  options: BBCodeToMarkdownOptions = {},
): string {
  return renderMarkdown(parse(input, options), options);
}

export { default as renderMarkdown } from './markdown_renderer.js';
export { default as parse } from './parser.js';
export { default as tokenize } from './tokenizer.js';
