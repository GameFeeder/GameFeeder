import type { RootNode } from '../../markup/ast.js';
import normalize from '../../markup/normalize.js';
import type { ParseOptions } from './parser.js';
import parse from './parser.js';

export type { ParseOptions } from './parser.js';

/** Parses the BBCode of a Steam news post into the shared markup tree.
 *
 * @param input - The raw `contents` of a Steam news item.
 * @param options - Parser limits.
 */
export default function parseBBCode(input: string, options: ParseOptions = {}): RootNode {
  return normalize(parse(input, options));
}

export { default as parse } from './parser.js';
export { default as tokenize } from './tokenizer.js';
