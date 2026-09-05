/** The AST produced by the Steam BBCode parser.
 *
 * Nodes are plain discriminated-union objects so that they are trivially
 * comparable in tests and cheap to build while parsing.
 */

/** Plain text. Line breaks inside a paragraph are kept as `\n`. */
export type TextNode = {
  type: 'text';
  value: string;
};

/** Text with a character style applied ([b], [i], [u], [strike], [spoiler]). */
export type StyleNode = {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'spoiler';
  children: InlineNode[];
};

/** A hyperlink ([url]). */
export type LinkNode = {
  type: 'link';
  url: string;
  children: InlineNode[];
};

/** An image ([img]). */
export type ImageNode = {
  type: 'image';
  url: string;
  alt?: string;
};

/** An embedded video ([previewyoutube], [video]). */
export type VideoNode = {
  type: 'video';
  url: string;
  children: InlineNode[];
};

/** A node that can appear inside a block of text. */
export type InlineNode = TextNode | StyleNode | LinkNode | ImageNode | VideoNode;

/** A paragraph of text ([p], or a run of text between block tags). */
export type ParagraphNode = {
  type: 'paragraph';
  children: InlineNode[];
};

/** A section heading ([h1] - [h6]). */
export type HeadingNode = {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: InlineNode[];
};

/** A single entry of a list ([*]). Items hold blocks, not just text. */
export type ListItemNode = {
  type: 'listItem';
  children: BlockNode[];
};

/** A bullet ([list]) or numbered ([olist]) list. */
export type ListNode = {
  type: 'list';
  ordered: boolean;
  children: ListItemNode[];
};

/** A quotation ([quote], [pullquote]). */
export type QuoteNode = {
  type: 'quote';
  author?: string;
  children: BlockNode[];
};

/** A preformatted block ([code]). */
export type CodeNode = {
  type: 'code';
  value: string;
};

/** A single cell of a table ([td], [th]). */
export type TableCellNode = {
  type: 'tableCell';
  header: boolean;
  children: BlockNode[];
};

/** A single row of a table ([tr]). */
export type TableRowNode = {
  type: 'tableRow';
  children: TableCellNode[];
};

/** A table ([table]). */
export type TableNode = {
  type: 'table';
  children: TableRowNode[];
};

/** A collapsible section ([expand]). Steam collapses it, we cannot. */
export type ExpandNode = {
  type: 'expand';
  children: BlockNode[];
};

/** A horizontal rule ([hr]). */
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
  | ExpandNode
  | SeparatorNode;

/** The root of a parsed Steam post. */
export type RootNode = {
  type: 'root';
  children: BlockNode[];
};

/** Any node of the tree. */
export type SteamNode =
  | RootNode
  | BlockNode
  | InlineNode
  | ListItemNode
  | TableRowNode
  | TableCellNode;

const INLINE_TYPES = new Set([
  'text',
  'bold',
  'italic',
  'underline',
  'strike',
  'spoiler',
  'link',
  'image',
  'video',
]);

/** Determines whether a node can appear inside a paragraph. */
export function isInlineNode(node: SteamNode): node is InlineNode {
  return INLINE_TYPES.has(node.type);
}

/** Collects the plain text of a node and all of its descendants. */
export function textContent(node: SteamNode): string {
  switch (node.type) {
    case 'text':
      return node.value;
    case 'code':
      return node.value;
    case 'image':
      return node.alt ?? '';
    case 'separator':
      return '';
    default:
      return node.children.map((child) => textContent(child)).join('');
  }
}
