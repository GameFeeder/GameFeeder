/** The document model that every news source parses into and every messenger
 * client renders from.
 *
 * Nodes are plain discriminated-union objects so that they are trivially
 * comparable in tests and cheap to build while parsing.
 *
 * The model is the union of what Discord and Telegram can express, so that a
 * renderer never has to guess what a source meant: it only has to decide how to
 * say it, or that its target cannot say it at all.
 */

/** Plain text. Never contains a line break; see {@link BreakNode}. */
export type TextNode = {
  type: 'text';
  value: string;
};

/** A hard line break within a block. */
export type BreakNode = {
  type: 'break';
};

/** Text with a character style applied. */
export type StyleNode = {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'spoiler';
  children: InlineNode[];
};

/** A span of preformatted text within a line. */
export type InlineCodeNode = {
  type: 'inlineCode';
  value: string;
};

/** A hyperlink. */
export type LinkNode = {
  type: 'link';
  url: string;
  children: InlineNode[];
};

/** An image. Contributes no text of its own beyond `alt`. */
export type ImageNode = {
  type: 'image';
  url: string;
  alt?: string;
};

/** An embedded video. `children` carry the label, if the source gave one. */
export type VideoNode = {
  type: 'video';
  url: string;
  children: InlineNode[];
};

/** A node that can appear inside a block of text. */
export type InlineNode =
  | TextNode
  | BreakNode
  | StyleNode
  | InlineCodeNode
  | LinkNode
  | ImageNode
  | VideoNode;

/** A paragraph of text. */
export type ParagraphNode = {
  type: 'paragraph';
  children: InlineNode[];
};

/** A section heading. */
export type HeadingNode = {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: InlineNode[];
};

/** A single entry of a list. Items hold blocks, not just text. */
export type ListItemNode = {
  type: 'listItem';
  children: BlockNode[];
};

/** A bullet or numbered list. */
export type ListNode = {
  type: 'list';
  ordered: boolean;
  /** The number the first item counts from, for `<ol start>`. */
  start?: number;
  children: ListItemNode[];
};

/** A quotation.
 *
 * `expandable` marks a section the source collapsed behind a summary, such as
 * Steam's `[expand]`. Targets that cannot collapse render it as a plain quote.
 */
export type QuoteNode = {
  type: 'quote';
  author?: string;
  expandable?: boolean;
  children: BlockNode[];
};

/** A preformatted block. */
export type CodeNode = {
  type: 'code';
  language?: string;
  value: string;
};

/** A single cell of a table. */
export type TableCellNode = {
  type: 'tableCell';
  header: boolean;
  children: BlockNode[];
};

/** A single row of a table. */
export type TableRowNode = {
  type: 'tableRow';
  children: TableCellNode[];
};

/** A table. */
export type TableNode = {
  type: 'table';
  children: TableRowNode[];
};

/** A horizontal rule. */
export type SeparatorNode = {
  type: 'separator';
};

/** A node that stands on its own, separated from its siblings by a blank line. */
export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | ListNode
  | QuoteNode
  | CodeNode
  | TableNode
  | SeparatorNode;

/** The root of a parsed document. */
export type RootNode = {
  type: 'root';
  children: BlockNode[];
};

/** Any node of the tree. */
export type MarkupNode =
  | RootNode
  | BlockNode
  | InlineNode
  | ListItemNode
  | TableRowNode
  | TableCellNode;

const INLINE_TYPES = new Set<MarkupNode['type']>([
  'text',
  'break',
  'bold',
  'italic',
  'underline',
  'strike',
  'spoiler',
  'inlineCode',
  'link',
  'image',
  'video',
]);

const BLOCK_TYPES = new Set<MarkupNode['type']>([
  'paragraph',
  'heading',
  'list',
  'quote',
  'code',
  'table',
  'separator',
]);

/** Determines whether a node can appear inside a paragraph. */
export function isInlineNode(node: MarkupNode): node is InlineNode {
  return INLINE_TYPES.has(node.type);
}

/** Determines whether a node stands on its own between blank lines. */
export function isBlockNode(node: MarkupNode): node is BlockNode {
  return BLOCK_TYPES.has(node.type);
}

/** Collects the plain text of a node and all of its descendants.
 *
 * This is the length measure that truncation budgets against, so blocks are
 * joined the way they read rather than run together.
 */
export function textContent(node: MarkupNode): string {
  switch (node.type) {
    case 'text':
    case 'code':
    case 'inlineCode':
      return node.value;
    case 'break':
      return '\n';
    case 'image':
      return node.alt ?? '';
    case 'separator':
      return '';
    // Inline containers run their children together.
    case 'bold':
    case 'italic':
    case 'underline':
    case 'strike':
    case 'spoiler':
    case 'link':
    case 'video':
    case 'paragraph':
    case 'heading':
      return node.children.map((child) => textContent(child)).join('');
    // Rows read as a line, cells within a row as a run.
    case 'table':
      return node.children.map((child) => textContent(child)).join('\n');
    case 'tableRow':
      return node.children.map((child) => textContent(child)).join(' ');
    case 'list':
      return node.children.map((child) => textContent(child)).join('\n');
    // Block containers separate their children by a blank line.
    case 'root':
    case 'quote':
    case 'listItem':
    case 'tableCell':
      return node.children.map((child) => textContent(child)).join('\n\n');
  }
}
