/** What each HTML element becomes in the markup tree.
 *
 * This table is the single source of truth for the mapping, in the same spirit
 * as `steam/bbcode/tags.ts`. An element that is not listed passes its children
 * through unchanged, so unknown or purely presentational markup never costs us
 * the text inside it.
 */

import type { HeadingNode, StyleNode } from '../ast.js';

/** How an element is turned into nodes. */
export type HtmlTagSpec =
  /** The element and everything inside it is dropped. */
  | { kind: 'ignore' }
  /** The element contributes nothing itself; its children take its place. */
  | { kind: 'transparent' }
  /** Holds blocks, but is not a block itself. */
  | { kind: 'blockContainer' }
  | { kind: 'paragraph' }
  | { kind: 'heading'; level: HeadingNode['level'] }
  | { kind: 'list'; ordered: boolean }
  | { kind: 'listItem' }
  | { kind: 'quote' }
  /** Preformatted: the text inside is taken verbatim. */
  | { kind: 'code' }
  | { kind: 'table' }
  | { kind: 'tableRow' }
  | { kind: 'tableCell'; header: boolean }
  | { kind: 'separator' }
  | { kind: 'break' }
  | { kind: 'image' }
  | { kind: 'style'; style: StyleNode['type'] }
  | { kind: 'inlineCode' }
  | { kind: 'link' }
  | { kind: 'video' };

const TAGS = new Map<string, HtmlTagSpec>([
  // Dropped outright: markup that carries no reader-visible text.
  ...(
    [
      'script',
      'style',
      'head',
      'meta',
      'title',
      'link',
      'noscript',
      'template',
      'svg',
      'form',
      'input',
      'button',
      'select',
      'textarea',
    ] as const
  ).map((tag) => [tag, { kind: 'ignore' }] as [string, HtmlTagSpec]),

  // Blocks.
  ['p', { kind: 'paragraph' }],
  ['h1', { kind: 'heading', level: 1 }],
  ['h2', { kind: 'heading', level: 2 }],
  ['h3', { kind: 'heading', level: 3 }],
  ['h4', { kind: 'heading', level: 4 }],
  ['h5', { kind: 'heading', level: 5 }],
  ['h6', { kind: 'heading', level: 6 }],
  ['ul', { kind: 'list', ordered: false }],
  ['ol', { kind: 'list', ordered: true }],
  ['li', { kind: 'listItem' }],
  ['blockquote', { kind: 'quote' }],
  ['pre', { kind: 'code' }],
  ['table', { kind: 'table' }],
  ['tr', { kind: 'tableRow' }],
  ['td', { kind: 'tableCell', header: false }],
  ['th', { kind: 'tableCell', header: true }],
  ['hr', { kind: 'separator' }],

  // Block containers: they group blocks without being one.
  ...(
    ['div', 'section', 'article', 'main', 'aside', 'header', 'footer', 'figure', 'dl'] as const
  ).map((tag) => [tag, { kind: 'blockContainer' }] as [string, HtmlTagSpec]),
  ['figcaption', { kind: 'paragraph' }],
  ['dt', { kind: 'paragraph' }],
  ['dd', { kind: 'paragraph' }],

  // Row groups hold rows directly, so they simply disappear.
  ...(['tbody', 'thead', 'tfoot', 'colgroup'] as const).map(
    (tag) => [tag, { kind: 'transparent' }] as [string, HtmlTagSpec],
  ),

  // Character styles.
  ['b', { kind: 'style', style: 'bold' }],
  ['strong', { kind: 'style', style: 'bold' }],
  ['i', { kind: 'style', style: 'italic' }],
  ['em', { kind: 'style', style: 'italic' }],
  ['u', { kind: 'style', style: 'underline' }],
  ['ins', { kind: 'style', style: 'underline' }],
  ['s', { kind: 'style', style: 'strike' }],
  ['del', { kind: 'style', style: 'strike' }],
  ['strike', { kind: 'style', style: 'strike' }],

  // Inline.
  ['code', { kind: 'inlineCode' }],
  ['kbd', { kind: 'inlineCode' }],
  ['samp', { kind: 'inlineCode' }],
  ['var', { kind: 'inlineCode' }],
  ['tt', { kind: 'inlineCode' }],
  ['a', { kind: 'link' }],
  ['img', { kind: 'image' }],
  ['br', { kind: 'break' }],
  ['iframe', { kind: 'video' }],
  ['video', { kind: 'video' }],
  ['embed', { kind: 'video' }],
]);

/** Classes that change what an element means, keyed by the class name.
 *
 * Steam's Community feeds mark up headings and spoilers with classes on a
 * `div` or `span` rather than with the elements that mean it, so the class is
 * the only thing that carries the intent.
 */
const CLASSES = new Map<string, HtmlTagSpec>([
  ['bb_h1', { kind: 'heading', level: 1 }],
  ['bb_h2', { kind: 'heading', level: 2 }],
  ['bb_h3', { kind: 'heading', level: 3 }],
  ['bb_h4', { kind: 'heading', level: 4 }],
  ['bb_h5', { kind: 'heading', level: 5 }],
  ['bb_h6', { kind: 'heading', level: 6 }],
  // The host of a link, which Steam appends after the link text itself.
  ['bb_link_host', { kind: 'ignore' }],
  ['tg-spoiler', { kind: 'style', style: 'spoiler' }],
  ['bb_spoiler', { kind: 'style', style: 'spoiler' }],
  ['spoiler', { kind: 'style', style: 'spoiler' }],
]);

const PASS_THROUGH: HtmlTagSpec = { kind: 'transparent' };

/** Looks up what an element becomes.
 *
 * @param name - The lower case tag name.
 * @param className - The element's `class` attribute, if it has one.
 */
export function htmlTagSpec(name: string, className?: string): HtmlTagSpec {
  for (const token of className?.split(/\s+/) ?? []) {
    const byClass = CLASSES.get(token);
    if (byClass) {
      return byClass;
    }
  }
  return TAGS.get(name) ?? PASS_THROUGH;
}
