/** The BBCode flavor used by Steam news posts.
 *
 * This table is the single source of truth for which tags exist. Anything that
 * is not listed here is not a tag: real posts contain bracketed prose such as
 * `[YOUR NAME]`, `[space-age]` or `[count=100]`, which must survive verbatim.
 */

/** How a tag behaves while parsing. */
export type TagKind =
  /** Stands on its own and is separated from its siblings by a blank line. */
  | 'block'
  /** Appears within a paragraph. */
  | 'inline'
  /** A single entry of a list. */
  | 'listItem'
  /** Its body is captured verbatim, without scanning for nested tags. */
  | 'raw'
  /** Has no body. A closing tag is tolerated but not required. */
  | 'void';

/** The parsing rules for a single tag. */
export type TagSpec = {
  /** The lower case name of the tag. */
  name: string;
  /** How the tag behaves while parsing. */
  kind: TagKind;
  /** Opening tags that implicitly close this one, e.g. `[*]` closes `[*]`. */
  closedBy: string[];
  /** Whether an unclosed instance is also closed by any block tag. */
  closedByBlock: boolean;
  /** Whether the children of this tag are blocks rather than inline nodes. */
  blockChildren: boolean;
};

function spec(
  name: string,
  kind: TagKind,
  options: Partial<Omit<TagSpec, 'name' | 'kind'>> = {},
): TagSpec {
  return {
    name,
    kind,
    closedBy: options.closedBy ?? [],
    closedByBlock: options.closedByBlock ?? false,
    blockChildren: options.blockChildren ?? false,
  };
}

const CELL_CLOSERS = ['td', 'th', 'tr'];

const SPECS: TagSpec[] = [
  // Blocks
  spec('p', 'block', { closedByBlock: true }),
  spec('h1', 'block', { closedByBlock: true }),
  spec('h2', 'block', { closedByBlock: true }),
  spec('h3', 'block', { closedByBlock: true }),
  spec('h4', 'block', { closedByBlock: true }),
  spec('h5', 'block', { closedByBlock: true }),
  spec('h6', 'block', { closedByBlock: true }),
  spec('list', 'block', { blockChildren: true }),
  spec('olist', 'block', { blockChildren: true }),
  spec('quote', 'block', { blockChildren: true }),
  spec('pullquote', 'block', { blockChildren: true }),
  spec('expand', 'block', { blockChildren: true }),
  spec('table', 'block', { blockChildren: true }),
  spec('tr', 'block', { closedBy: ['tr'], blockChildren: true }),
  spec('td', 'block', { closedBy: CELL_CLOSERS, blockChildren: true }),
  spec('th', 'block', { closedBy: CELL_CLOSERS, blockChildren: true }),
  // List items
  spec('*', 'listItem', { closedBy: ['*'], blockChildren: true }),
  // Verbatim bodies
  spec('code', 'raw'),
  spec('noparse', 'raw'),
  // Bodyless
  spec('hr', 'void'),
  // Inline
  spec('b', 'inline'),
  spec('i', 'inline'),
  spec('u', 'inline'),
  spec('strike', 'inline'),
  spec('spoiler', 'inline'),
  spec('url', 'inline'),
  spec('img', 'inline'),
  spec('previewyoutube', 'inline'),
  spec('previewimg', 'inline'),
  spec('dynamiclink', 'inline'),
  spec('video', 'inline'),
];

/** Every tag of the Steam BBCode flavor, keyed by its lower case name. */
export const TAGS: ReadonlyMap<string, TagSpec> = new Map(SPECS.map((tag) => [tag.name, tag]));

/** Determines whether a name denotes a Steam BBCode tag. */
export function isKnownTag(name: string): boolean {
  return TAGS.has(name.toLowerCase());
}

/** Looks up the parsing rules of a tag. */
export function tagSpec(name: string): TagSpec | undefined {
  return TAGS.get(name.toLowerCase());
}

/** Determines whether a tag starts a new block. */
export function isBlockTag(name: string): boolean {
  const tag = tagSpec(name);
  return tag !== undefined && (tag.kind === 'block' || tag.kind === 'void' || tag.kind === 'raw');
}
