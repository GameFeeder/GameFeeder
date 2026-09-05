import type {
  BlockNode,
  HeadingNode,
  InlineNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  RootNode,
  StyleNode,
  TableCellNode,
  TableNode,
  TableRowNode,
} from './ast.js';
import { textContent } from './ast.js';
import type { TagSpec } from './tags.js';
import { isBlockTag, tagSpec } from './tags.js';
import type { OpenToken, Token } from './tokenizer.js';
import tokenize from './tokenizer.js';

/** Options for {@link parse}. */
export type ParseOptions = {
  /** How deep tags may nest before further openers degrade to literal text. */
  maxDepth?: number;
};

const DEFAULT_MAX_DEPTH = 32;

/** Blank line, i.e. a paragraph boundary in posts that do not use [p]. */
const PARAGRAPH_BREAK = /\n[ \t]*\n[\s]*/;

const STYLE_TYPES: Record<string, StyleNode['type']> = {
  b: 'bold',
  i: 'italic',
  u: 'underline',
  strike: 'strike',
  spoiler: 'spoiler',
};

const HEADING_LEVELS: Record<string, HeadingNode['level']> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

/** Determines whether a block carries anything worth rendering. */
function isEmptyBlock(block: BlockNode): boolean {
  switch (block.type) {
    case 'separator':
      return false;
    case 'code':
      return block.value.trim() === '';
    case 'paragraph':
    case 'heading':
      return !block.children.some((child) => child.type !== 'text' || child.value.trim() !== '');
    case 'list':
      return block.children.length === 0;
    case 'table':
      return block.children.length === 0;
    default:
      return block.children.length === 0;
  }
}

/** Drops empty blocks and merges lists that Steam split into single-item chunks. */
function normalizeBlocks(blocks: BlockNode[]): BlockNode[] {
  const result: BlockNode[] = [];

  for (const block of blocks) {
    if (isEmptyBlock(block)) {
      continue;
    }
    const previous = result[result.length - 1];

    if (previous?.type === 'list' && block.type === 'list' && previous.ordered === block.ordered) {
      previous.children.push(...block.children);
      continue;
    }
    result.push(block);
  }
  return result;
}

/** Removes the whitespace surrounding a run of inline nodes. */
function trimInline(nodes: InlineNode[]): InlineNode[] {
  const result = [...nodes];

  while (result.length > 0) {
    const first = result[0];
    if (first.type !== 'text') {
      break;
    }
    const value = first.value.replace(/^\s+/, '');
    if (value === '') {
      result.shift();
      continue;
    }
    result[0] = { type: 'text', value };
    break;
  }

  while (result.length > 0) {
    const last = result[result.length - 1];
    if (last.type !== 'text') {
      break;
    }
    const value = last.value.replace(/\s+$/, '');
    if (value === '') {
      result.pop();
      continue;
    }
    result[result.length - 1] = { type: 'text', value };
    break;
  }
  return result;
}

/** Splits a run of inline nodes into paragraphs at blank lines.
 *
 * Older posts have no [p] tags at all and rely on blank lines instead.
 */
function paragraphsFrom(nodes: InlineNode[]): ParagraphNode[] {
  const paragraphs: ParagraphNode[] = [];
  let current: InlineNode[] = [];

  const flush = (): void => {
    const trimmed = trimInline(current);
    if (trimmed.length > 0) {
      paragraphs.push({ type: 'paragraph', children: trimmed });
    }
    current = [];
  };

  for (const node of nodes) {
    if (node.type !== 'text') {
      current.push(node);
      continue;
    }
    const parts = node.value.split(PARAGRAPH_BREAK);
    parts.forEach((part, index) => {
      if (index > 0) {
        flush();
      }
      if (part !== '') {
        current.push({ type: 'text', value: part });
      }
    });
  }
  flush();

  return paragraphs;
}

class Parser {
  private readonly tokens: Token[];
  private readonly maxDepth: number;
  /** The names of the tags that are currently open, innermost last. */
  private readonly open: string[] = [];
  private pos = 0;
  private depth = 0;

  constructor(tokens: Token[], maxDepth: number) {
    this.tokens = tokens;
    this.maxDepth = maxDepth;
  }

  public parse(): RootNode {
    return { type: 'root', children: this.parseBlocks(undefined) };
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  /** Consumes the closing tag of `name` if it is the next token. */
  private consumeCloser(name: string): void {
    const token = this.peek();
    if (token?.kind === 'close' && token.name === name) {
      this.pos += 1;
    }
  }

  /** Determines whether an opening tag implicitly closes the enclosing element. */
  private closesFrame(frame: TagSpec | undefined, token: OpenToken): boolean {
    if (!frame) {
      return false;
    }
    if (frame.closedBy.includes(token.name)) {
      return true;
    }
    return frame.closedByBlock && isBlockTag(token.name);
  }

  /** Parses the children of an element as a sequence of blocks. */
  private parseBlocks(frame: TagSpec | undefined): BlockNode[] {
    const blocks: BlockNode[] = [];
    let inline: InlineNode[] = [];

    const flush = (): void => {
      blocks.push(...paragraphsFrom(inline));
      inline = [];
    };

    for (;;) {
      const token = this.peek();
      if (!token) {
        break;
      }

      if (token.kind === 'close') {
        // A closer for an ancestor unwinds to that ancestor, implicitly closing
        // everything in between. Anything else is a stray closer.
        if (this.open.includes(token.name)) {
          break;
        }
        this.pos += 1;
        continue;
      }

      if (token.kind === 'open') {
        const spec = tagSpec(token.name);
        if (!spec) {
          this.pos += 1;
          continue;
        }
        if (this.closesFrame(frame, token)) {
          break;
        }
        if (spec.kind !== 'inline') {
          flush();
          blocks.push(...this.parseBlock(token, spec));
          continue;
        }
      }

      inline.push(...this.parseInlineRun(frame));
    }
    flush();

    return normalizeBlocks(blocks);
  }

  /** Parses a single block level element. */
  private parseBlock(token: OpenToken, spec: TagSpec): BlockNode[] {
    if (this.depth >= this.maxDepth) {
      this.pos += 1;
      return [{ type: 'paragraph', children: [{ type: 'text', value: token.raw }] }];
    }
    this.depth += 1;
    try {
      return this.parseBlockInner(token, spec);
    } finally {
      this.depth -= 1;
    }
  }

  private parseBlockInner(token: OpenToken, spec: TagSpec): BlockNode[] {
    switch (spec.kind) {
      case 'void':
        this.pos += 1;
        this.consumeCloser(token.name);
        return [{ type: 'separator' }];
      case 'raw':
        return this.parseRaw(token);
      case 'listItem':
        return [this.parseBareList()];
      default:
        break;
    }

    switch (token.name) {
      case 'list':
      case 'olist':
        return [this.parseList(token)];
      case 'table':
        return [this.parseTable(token)];
      case 'tr':
      case 'td':
      case 'th':
        // A cell outside of a table: keep the content, drop the structure.
        this.pos += 1;
        return this.parseContainer(token.name, spec);
      case 'quote':
      case 'pullquote': {
        this.pos += 1;
        const children = this.parseContainer(token.name, spec);
        const author = token.value?.split(';')[0]?.trim();
        return [{ type: 'quote', author: author || undefined, children }];
      }
      case 'expand': {
        this.pos += 1;
        return [{ type: 'expand', children: this.parseContainer(token.name, spec) }];
      }
      case 'p': {
        this.pos += 1;
        return this.parseContainer(token.name, spec);
      }
      default: {
        const level = HEADING_LEVELS[token.name];
        this.pos += 1;
        const children = this.parseInlineChildren(token.name, spec);
        return level ? [{ type: 'heading', level, children: trimInline(children) }] : [];
      }
    }
  }

  /** Parses the body of an element that holds blocks. Assumes the opener is consumed. */
  private parseContainer(name: string, spec: TagSpec): BlockNode[] {
    this.open.push(name);
    const children = this.parseBlocks(spec);
    this.open.pop();
    this.consumeCloser(name);
    return children;
  }

  /** Parses `[code]` and `[noparse]`, whose bodies the tokenizer captured verbatim. */
  private parseRaw(token: OpenToken): BlockNode[] {
    this.pos += 1;
    const body = this.peek();
    let value = '';

    if (body?.kind === 'text') {
      value = body.value;
      this.pos += 1;
    }
    this.consumeCloser(token.name);

    if (token.name === 'noparse') {
      // [noparse] only suppresses markup, it is not preformatted.
      return paragraphsFrom([{ type: 'text', value }]);
    }
    return [{ type: 'code', value: value.replace(/^\n+|\n+$/g, '') }];
  }

  private parseList(token: OpenToken): ListNode {
    this.pos += 1;
    const ordered = token.name === 'olist';
    this.open.push(token.name);
    const children = this.parseListItems(token.name);
    this.open.pop();
    this.consumeCloser(token.name);
    return { type: 'list', ordered, children };
  }

  /** Wraps `[*]` items that appear without an enclosing `[list]`. */
  private parseBareList(): ListNode {
    this.open.push('list');
    const children = this.parseListItems('list');
    this.open.pop();
    return { type: 'list', ordered: false, children };
  }

  private parseListItems(listName: string): ListItemNode[] {
    const items: ListItemNode[] = [];

    for (;;) {
      const token = this.peek();
      if (!token) {
        break;
      }
      if (token.kind === 'close') {
        if (token.name === listName || this.open.includes(token.name)) {
          break;
        }
        this.pos += 1;
        continue;
      }
      if (token.kind === 'text' && token.value.trim() === '') {
        this.pos += 1;
        continue;
      }
      if (token.kind === 'open' && token.name === '*') {
        this.pos += 1;
      } else if (items.length > 0) {
        // Content after the last item that is not introduced by [*] ends the list.
        break;
      }
      items.push(this.parseListItem());
    }
    return items;
  }

  private parseListItem(): ListItemNode {
    const spec = tagSpec('*') as TagSpec;
    this.open.push('*');
    const children = this.parseBlocks(spec);
    this.open.pop();
    this.consumeCloser('*');
    return { type: 'listItem', children };
  }

  private parseTable(token: OpenToken): TableNode {
    this.pos += 1;
    this.open.push('table');
    const children: TableRowNode[] = [];

    for (;;) {
      const next = this.peek();
      if (!next) {
        break;
      }
      if (next.kind === 'close') {
        if (next.name === 'table' || this.open.includes(next.name)) {
          break;
        }
        this.pos += 1;
        continue;
      }
      if (next.kind === 'text' && next.value.trim() === '') {
        this.pos += 1;
        continue;
      }
      if (next.kind === 'open' && next.name === 'tr') {
        this.pos += 1;
      } else if (!(next.kind === 'open' && (next.name === 'td' || next.name === 'th'))) {
        // Anything else inside a table is not part of the grid.
        this.pos += 1;
        continue;
      }
      children.push(this.parseTableRow());
    }
    this.open.pop();
    this.consumeCloser('table');
    return { type: 'table', children };
  }

  private parseTableRow(): TableRowNode {
    this.open.push('tr');
    const children: TableCellNode[] = [];

    for (;;) {
      const token = this.peek();
      if (!token) {
        break;
      }
      if (token.kind === 'close') {
        if (token.name === 'tr' || this.open.includes(token.name)) {
          break;
        }
        this.pos += 1;
        continue;
      }
      if (token.kind === 'text' && token.value.trim() === '') {
        this.pos += 1;
        continue;
      }
      if (token.kind === 'open' && (token.name === 'td' || token.name === 'th')) {
        this.pos += 1;
        children.push(this.parseTableCell(token.name));
        continue;
      }
      break;
    }
    this.open.pop();
    this.consumeCloser('tr');
    return { type: 'tableRow', children };
  }

  private parseTableCell(name: string): TableCellNode {
    const spec = tagSpec(name) as TagSpec;
    this.open.push(name);
    const children = this.parseBlocks(spec);
    this.open.pop();
    this.consumeCloser(name);
    return { type: 'tableCell', header: name === 'th', children };
  }

  /** Consumes a run of inline content, stopping at the next block or closer. */
  private parseInlineRun(frame: TagSpec | undefined): InlineNode[] {
    const nodes: InlineNode[] = [];

    for (;;) {
      const token = this.peek();
      if (!token) {
        break;
      }
      if (token.kind === 'text') {
        this.pos += 1;
        nodes.push({ type: 'text', value: token.value });
        continue;
      }
      if (token.kind === 'close') {
        if (this.open.includes(token.name)) {
          break;
        }
        this.pos += 1;
        continue;
      }
      const spec = tagSpec(token.name);
      if (!spec || spec.kind !== 'inline' || this.closesFrame(frame, token)) {
        break;
      }
      this.pos += 1;
      nodes.push(...this.parseInlineTag(token, spec));
    }
    return nodes;
  }

  /** Parses the children of an inline element. Assumes the opener is consumed. */
  private parseInlineChildren(name: string, spec: TagSpec): InlineNode[] {
    this.open.push(name);
    const children = this.parseInlineRun(spec);
    this.open.pop();
    this.consumeCloser(name);
    return children;
  }

  private parseInlineTag(token: OpenToken, spec: TagSpec): InlineNode[] {
    if (this.depth >= this.maxDepth) {
      return [{ type: 'text', value: token.raw }];
    }
    this.depth += 1;
    try {
      return this.parseInlineTagInner(token, spec);
    } finally {
      this.depth -= 1;
    }
  }

  private parseInlineTagInner(token: OpenToken, spec: TagSpec): InlineNode[] {
    const style = STYLE_TYPES[token.name];
    if (style) {
      const children = this.parseInlineChildren(token.name, spec);
      return children.length > 0 ? [{ type: style, children }] : [];
    }

    switch (token.name) {
      case 'url': {
        const children = this.parseInlineChildren(token.name, spec);
        const url = token.value ?? token.attrs.get('href') ?? '';
        if (!url) {
          return children;
        }
        return [{ type: 'link', url, children }];
      }
      case 'dynamiclink': {
        const children = this.parseInlineChildren(token.name, spec);
        const url = token.attrs.get('href') ?? token.value ?? '';
        if (!url) {
          return children;
        }
        return [{ type: 'link', url, children }];
      }
      case 'img':
      case 'previewimg': {
        const children = this.parseInlineChildren(token.name, spec);
        // Both `[img]URL[/img]` and `[img src="URL"][/img]` occur in the wild.
        const url = token.attrs.get('src') ?? token.value ?? inlineText(children);
        return url.trim() ? [{ type: 'image', url }] : children;
      }
      case 'previewyoutube': {
        const children = this.parseInlineChildren(token.name, spec);
        // The value is `<videoId>;<alignment>`.
        const id = (token.value ?? '').split(';')[0].trim();
        if (!id) {
          return children;
        }
        return [{ type: 'video', url: `https://youtu.be/${id}`, children }];
      }
      case 'video': {
        const children = this.parseInlineChildren(token.name, spec);
        const url = token.attrs.get('mp4') ?? token.attrs.get('webm') ?? token.value ?? '';
        if (!url) {
          return children;
        }
        return [{ type: 'video', url, children }];
      }
      default: {
        return this.parseInlineChildren(token.name, spec);
      }
    }
  }
}

/** Joins the text of a run of inline nodes. */
function inlineText(nodes: InlineNode[]): string {
  return nodes.map((node) => textContent(node)).join('');
}

/** Parses the BBCode of a Steam news post into an abstract syntax tree.
 *
 * The parser is total: any input produces a tree, and no input is dropped.
 * Unclosed tags are closed implicitly, stray closing tags are discarded and
 * text that merely looks like a tag is kept verbatim.
 *
 * @param input - The raw `contents` of a Steam news item.
 * @param options - Parser limits.
 */
export default function parse(input: string, options: ParseOptions = {}): RootNode {
  const parser = new Parser(tokenize(input), options.maxDepth ?? DEFAULT_MAX_DEPTH);
  return parser.parse();
}
