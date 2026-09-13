import { Parser as HtmlParser } from 'htmlparser2';
import type {
  BlockNode,
  InlineNode,
  ListItemNode,
  RootNode,
  TableCellNode,
  TableRowNode,
} from '../ast.js';
import normalize, { trimInline } from '../normalize.js';
import type { HtmlTagSpec } from './html_tags.js';
import { htmlTagSpec } from './html_tags.js';

/** Options for {@link parseHtml}. */
export type HtmlParseOptions = {
  /** Whether line breaks in the text are meaningful.
   *
   * HTML says they are ordinary whitespace, and for well-formed markup that is
   * right. Some feeds instead write their posts as good as plain text with a
   * few tags sprinkled in, and rely on blank lines for paragraphs and single
   * ones for breaks; those need this turned on or the post arrives as one
   * enormous run-on paragraph.
   */
  preserveLineBreaks?: boolean;
};

const DEFAULTS = {
  preserveLineBreaks: false,
};

/** A blank line, which separates paragraphs when breaks are meaningful. */
const PARAGRAPH_BREAK = /\n[ \t]*\n\s*/;

/** Hosts whose embeds are worth keeping as a video rather than dropping. */
const VIDEO_HOSTS = /youtube|youtu\.be|vimeo|twitch|streamable/i;

/** One open element, collecting whatever its children contribute. */
type Frame = {
  spec: HtmlTagSpec;
  attrs: Record<string, string>;
  /** Whether this element, or one above it, is being dropped. */
  dropped: boolean;
  /** Whether the text inside is taken verbatim. */
  verbatim: boolean;
  blocks: BlockNode[];
  inline: InlineNode[];
  items: ListItemNode[];
  rows: TableRowNode[];
  cells: TableCellNode[];
  raw: string;
};

function newFrame(spec: HtmlTagSpec, attrs: Record<string, string>, parent?: Frame): Frame {
  return {
    spec,
    attrs,
    dropped: (parent?.dropped ?? false) || spec.kind === 'ignore',
    verbatim: (parent?.verbatim ?? false) || spec.kind === 'code',
    blocks: [],
    inline: [],
    items: [],
    rows: [],
    cells: [],
    raw: '',
  };
}

class Builder {
  private readonly options: Required<HtmlParseOptions>;
  private readonly stack: Frame[];

  constructor(options: HtmlParseOptions) {
    this.options = { ...DEFAULTS, ...options };
    this.stack = [newFrame({ kind: 'blockContainer' }, {})];
  }

  private get top(): Frame {
    return this.stack[this.stack.length - 1];
  }

  /** The innermost preformatted element, which owns all the text inside it. */
  private verbatimFrame(): Frame {
    for (let index = this.stack.length - 1; index >= 0; index -= 1) {
      if (this.stack[index].spec.kind === 'code') {
        return this.stack[index];
      }
    }
    return this.top;
  }

  public openTag(name: string, attrs: Record<string, string>): void {
    // A void element is reported as opened and closed straight away, so its
    // node is built on the way out like every other element's.
    const spec = htmlTagSpec(name, attrs.class);
    this.stack.push(newFrame(spec, attrs, this.top));
  }

  public closeTag(): void {
    if (this.stack.length === 1) {
      return;
    }
    const frame = this.stack.pop() as Frame;
    const parent = this.top;

    if (frame.dropped) {
      return;
    }
    this.attach(frame, parent);
  }

  public addText(value: string): void {
    const frame = this.top;

    if (frame.dropped) {
      return;
    }
    if (frame.verbatim) {
      // The text belongs to the <pre> itself, however deeply it is wrapped.
      this.verbatimFrame().raw += value;
      return;
    }
    if (this.options.preserveLineBreaks) {
      this.addBrokenText(value, frame);
      return;
    }
    // HTML treats every run of whitespace, line breaks included, as one space.
    const collapsed = value.replace(/\s+/g, ' ');
    if (collapsed !== '') {
      frame.inline.push({ type: 'text', value: collapsed });
    }
  }

  /** Adds text whose line breaks carry the structure. */
  private addBrokenText(value: string, frame: Frame): void {
    value.split(PARAGRAPH_BREAK).forEach((part, index) => {
      if (index > 0) {
        this.flushInline(frame);
      }
      part.split('\n').forEach((lineValue, lineIndex) => {
        if (lineIndex > 0) {
          frame.inline.push({ type: 'break' });
        }
        const collapsed = lineValue.replace(/[^\S\n]+/g, ' ');
        if (collapsed !== '') {
          frame.inline.push({ type: 'text', value: collapsed });
        }
      });
    });
  }

  /** Turns whatever inline content a frame has collected into a paragraph. */
  private flushInline(frame: Frame): void {
    const children = trimInline(frame.inline);
    frame.inline = [];

    if (children.length > 0) {
      frame.blocks.push({ type: 'paragraph', children });
    }
  }

  private addBlock(parent: Frame, block: BlockNode): void {
    this.flushInline(parent);
    parent.blocks.push(block);
  }

  /** Collects everything a frame holds as a sequence of blocks. */
  private blocksOf(frame: Frame): BlockNode[] {
    this.flushInline(frame);
    return frame.blocks;
  }

  private attach(frame: Frame, parent: Frame): void {
    const { spec } = frame;

    switch (spec.kind) {
      case 'ignore':
        return;
      case 'transparent': {
        // Children take the element's place, as blocks if it collected any.
        if (frame.blocks.length > 0) {
          for (const block of this.blocksOf(frame)) {
            this.addBlock(parent, block);
          }
          parent.items.push(...frame.items);
          parent.rows.push(...frame.rows);
          parent.cells.push(...frame.cells);
          return;
        }
        parent.inline.push(...frame.inline);
        parent.items.push(...frame.items);
        parent.rows.push(...frame.rows);
        parent.cells.push(...frame.cells);
        return;
      }
      case 'blockContainer': {
        for (const block of this.blocksOf(frame)) {
          this.addBlock(parent, block);
        }
        return;
      }
      case 'paragraph': {
        for (const block of this.blocksOf(frame)) {
          this.addBlock(parent, block);
        }
        return;
      }
      case 'heading': {
        const children = trimInline(frame.inline);
        if (children.length > 0) {
          this.addBlock(parent, { type: 'heading', level: spec.level, children });
        }
        return;
      }
      case 'list': {
        this.flushInline(frame);
        const items = [...frame.items];
        // A list that holds loose blocks rather than items still has content.
        if (frame.blocks.length > 0) {
          items.push({ type: 'listItem', children: frame.blocks });
        }
        if (items.length > 0) {
          this.addBlock(parent, { type: 'list', ordered: spec.ordered, children: items });
        }
        return;
      }
      case 'listItem': {
        const item: ListItemNode = { type: 'listItem', children: this.blocksOf(frame) };
        if (parent.spec.kind === 'list') {
          parent.items.push(item);
          return;
        }
        // An item outside a list still deserves a bullet.
        this.addBlock(parent, { type: 'list', ordered: false, children: [item] });
        return;
      }
      case 'quote': {
        const children = this.blocksOf(frame);
        if (children.length > 0) {
          this.addBlock(parent, { type: 'quote', children });
        }
        return;
      }
      case 'code': {
        const value = frame.raw.replace(/^\n+|\n+$/g, '');
        if (value.trim() !== '') {
          this.addBlock(parent, { type: 'code', value });
        }
        return;
      }
      case 'table': {
        this.flushInline(frame);
        const rows = [...frame.rows];
        if (frame.cells.length > 0) {
          rows.push({ type: 'tableRow', children: frame.cells });
        }
        if (rows.length > 0) {
          this.addBlock(parent, { type: 'table', children: rows });
        }
        return;
      }
      case 'tableRow': {
        const rowNode: TableRowNode = { type: 'tableRow', children: frame.cells };
        if (rowNode.children.length === 0) {
          return;
        }
        if (parent.spec.kind === 'table' || parent.spec.kind === 'transparent') {
          parent.rows.push(rowNode);
          return;
        }
        this.addBlock(parent, { type: 'table', children: [rowNode] });
        return;
      }
      case 'tableCell': {
        const cellNode: TableCellNode = {
          type: 'tableCell',
          header: spec.header,
          children: this.blocksOf(frame),
        };
        // A cell outside a row is still collected; the table gathers the
        // strays into a row of their own.
        parent.cells.push(cellNode);
        return;
      }
      case 'separator':
        this.addBlock(parent, { type: 'separator' });
        return;
      case 'break':
        parent.inline.push({ type: 'break' });
        return;
      case 'image': {
        const url = frame.attrs.src ?? '';
        if (url.trim() === '') {
          return;
        }
        const alt = frame.attrs.alt?.trim();
        parent.inline.push(alt ? { type: 'image', url, alt } : { type: 'image', url });
        return;
      }
      case 'style': {
        const children = frame.inline;
        if (children.length > 0) {
          parent.inline.push({ type: spec.style, children });
        }
        return;
      }
      case 'inlineCode': {
        // A <code> directly inside a <pre> is the code block, not a span of its own.
        if (parent.spec.kind === 'code') {
          return;
        }
        const value = frame.inline.map((node) => (node.type === 'text' ? node.value : '')).join('');
        if (value !== '') {
          parent.inline.push({ type: 'inlineCode', value });
        }
        return;
      }
      case 'link': {
        const url = frame.attrs.href ?? '';
        if (url.trim() === '') {
          parent.inline.push(...frame.inline);
          return;
        }
        parent.inline.push({ type: 'link', url, children: frame.inline });
        return;
      }
      case 'video': {
        const url = frame.attrs.src ?? '';
        if (!VIDEO_HOSTS.test(url)) {
          // Anything else in an embed is not something a reader can follow.
          parent.inline.push(...frame.inline);
          return;
        }
        parent.inline.push({ type: 'video', url, children: frame.inline });
        return;
      }
    }
  }

  public finish(): RootNode {
    // Close anything the document left open.
    while (this.stack.length > 1) {
      this.closeTag();
    }
    return { type: 'root', children: this.blocksOf(this.stack[0]) };
  }
}

/** Parses an HTML document into the shared markup tree.
 *
 * The parser is total: malformed markup produces a tree rather than an error,
 * and an element the table does not know passes its children through, so text
 * is never lost to markup we did not anticipate.
 *
 * @param html - The HTML to parse.
 * @param options - Parser overrides.
 */
export default function parseHtml(html: string, options: HtmlParseOptions = {}): RootNode {
  const builder = new Builder(options);
  const parser = new HtmlParser(
    {
      onopentag: (name, attrs) => builder.openTag(name.toLowerCase(), attrs),
      ontext: (value) => builder.addText(value),
      onclosetag: () => builder.closeTag(),
    },
    { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true },
  );

  parser.write(html);
  parser.end();

  return normalize(builder.finish());
}
