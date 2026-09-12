/** Constructors for {@link MarkupNode}s.
 *
 * These exist so that code which knows what it wants to say — command replies,
 * the notification envelope, providers that synthesize their own summary — can
 * build a tree directly instead of writing markup into a string and hoping the
 * far end parses it back the same way.
 *
 * Strings are accepted wherever inline content is, and are treated as literal
 * text: a caller can never accidentally inject formatting through one. Line
 * breaks in them become {@link BreakNode}s, which keeps the invariant that a
 * {@link TextNode} holds no `\n`.
 */

import type {
  BlockNode,
  BreakNode,
  CodeNode,
  HeadingNode,
  ImageNode,
  InlineCodeNode,
  InlineNode,
  LinkNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  QuoteNode,
  RootNode,
  SeparatorNode,
  StyleNode,
  TableCellNode,
  TableNode,
  TableRowNode,
  TextNode,
  VideoNode,
} from './ast.js';

/** Anything that can be given where inline content is expected. */
export type InlineInput = InlineNode | string;

/** Anything that can be given where block content is expected. */
export type BlockInput = BlockNode | string;

/** A single run of text. The value must not contain a line break. */
export function text(value: string): TextNode {
  return { type: 'text', value };
}

/** A hard line break. */
export function br(): BreakNode {
  return { type: 'break' };
}

/** Converts a string to text nodes, turning its line breaks into breaks. */
function fromString(value: string): InlineNode[] {
  const parts = value.split('\n');
  const nodes: InlineNode[] = [];

  parts.forEach((part, index) => {
    if (index > 0) {
      nodes.push(br());
    }
    if (part !== '') {
      nodes.push(text(part));
    }
  });
  return nodes;
}

/** Normalizes the inline arguments of a builder into a flat run of nodes. */
export function inline(...children: InlineInput[]): InlineNode[] {
  return children.flatMap((child) => (typeof child === 'string' ? fromString(child) : [child]));
}

/** Normalizes the block arguments of a builder, wrapping bare strings. */
function blocks(children: BlockInput[]): BlockNode[] {
  return children.map((child) => (typeof child === 'string' ? paragraph(child) : child));
}

function style(type: StyleNode['type'], children: InlineInput[]): StyleNode {
  return { type, children: inline(...children) };
}

/** Bold text. */
export function bold(...children: InlineInput[]): StyleNode {
  return style('bold', children);
}

/** Italic text. */
export function italic(...children: InlineInput[]): StyleNode {
  return style('italic', children);
}

/** Underlined text. */
export function underline(...children: InlineInput[]): StyleNode {
  return style('underline', children);
}

/** Struck-through text. */
export function strike(...children: InlineInput[]): StyleNode {
  return style('strike', children);
}

/** Text hidden behind a spoiler. */
export function spoiler(...children: InlineInput[]): StyleNode {
  return style('spoiler', children);
}

/** A span of preformatted text within a line. */
export function inlineCode(value: string): InlineCodeNode {
  return { type: 'inlineCode', value };
}

/** A hyperlink. Defaults to showing the URL when given no label. */
export function link(url: string, ...children: InlineInput[]): LinkNode {
  return {
    type: 'link',
    url,
    children: children.length > 0 ? inline(...children) : [text(url)],
  };
}

/** An image. */
export function image(url: string, alt?: string): ImageNode {
  return alt === undefined ? { type: 'image', url } : { type: 'image', url, alt };
}

/** An embedded video. */
export function video(url: string, ...children: InlineInput[]): VideoNode {
  return { type: 'video', url, children: inline(...children) };
}

/** A paragraph of text. */
export function paragraph(...children: InlineInput[]): ParagraphNode {
  return { type: 'paragraph', children: inline(...children) };
}

/** A section heading. */
export function heading(level: HeadingNode['level'], ...children: InlineInput[]): HeadingNode {
  return { type: 'heading', level, children: inline(...children) };
}

/** A single entry of a list. */
export function listItem(...children: BlockInput[]): ListItemNode {
  return { type: 'listItem', children: blocks(children) };
}

/** A bullet list. */
export function list(...items: ListItemNode[]): ListNode {
  return { type: 'list', ordered: false, children: items };
}

/** A numbered list. */
export function orderedList(...items: ListItemNode[]): ListNode {
  return { type: 'list', ordered: true, children: items };
}

/** Options for {@link quote}. */
export type QuoteOptions = {
  /** Who is being quoted. */
  author?: string;
  /** Whether the source collapsed this section behind a summary. */
  expandable?: boolean;
};

/** A quotation. */
export function quote(options: QuoteOptions, ...children: BlockInput[]): QuoteNode {
  const node: QuoteNode = { type: 'quote', children: blocks(children) };

  if (options.author !== undefined) {
    node.author = options.author;
  }
  if (options.expandable !== undefined) {
    node.expandable = options.expandable;
  }
  return node;
}

/** A preformatted block. */
export function code(value: string, language?: string): CodeNode {
  return language === undefined ? { type: 'code', value } : { type: 'code', language, value };
}

/** A single cell of a table. */
export function cell(...children: BlockInput[]): TableCellNode {
  return { type: 'tableCell', header: false, children: blocks(children) };
}

/** A single header cell of a table. */
export function headerCell(...children: BlockInput[]): TableCellNode {
  return { type: 'tableCell', header: true, children: blocks(children) };
}

/** A single row of a table. */
export function row(...cells: TableCellNode[]): TableRowNode {
  return { type: 'tableRow', children: cells };
}

/** A table. */
export function table(...rows: TableRowNode[]): TableNode {
  return { type: 'table', children: rows };
}

/** A horizontal rule. */
export function separator(): SeparatorNode {
  return { type: 'separator' };
}

/** The root of a document. */
export function doc(...children: BlockInput[]): RootNode {
  return { type: 'root', children: blocks(children) };
}
