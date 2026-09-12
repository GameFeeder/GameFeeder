import type {
  BlockNode,
  InlineNode,
  ListItemNode,
  ListNode,
  QuoteNode,
  RootNode,
  TableNode,
} from '../ast.js';
import { flatten, indentRest, joinBlocks, tidy } from './lines.js';

/** Options for {@link renderPlain}. */
export type PlainRenderOptions = {
  /** The string that separates the cells of a table row. */
  cellSeparator?: string;
};

const DEFAULTS = {
  cellSeparator: ' | ',
};

/** Renders a document as plain text, with no markup of any kind.
 *
 * This is what the fields that render no markup want — a Discord embed's title,
 * author and footer — as well as log lines and anything that has to be measured
 * rather than shown.
 */
class Renderer {
  private readonly options: Required<PlainRenderOptions>;

  constructor(options: PlainRenderOptions) {
    this.options = { ...DEFAULTS, ...options };
  }

  public render(root: RootNode): string {
    return tidy(joinBlocks(this.renderBlocks(root.children, 0)));
  }

  private renderBlocks(blocks: BlockNode[], level: number): string[] {
    return blocks.map((block) => this.renderBlock(block, level)).filter((text) => text !== '');
  }

  private renderBlock(block: BlockNode, level: number): string {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
        return this.renderInline(block.children);
      case 'list':
        return this.renderList(block, level);
      case 'quote':
        return this.renderQuote(block, level);
      case 'code':
        return block.value;
      case 'table':
        return this.renderTable(block);
      case 'separator':
        return '---';
    }
  }

  private renderList(block: ListNode, level: number): string {
    const start = block.start ?? 1;

    return block.children
      .map((item, index) =>
        this.renderListItem(item, level, block.ordered ? start + index : undefined),
      )
      .filter((line) => line !== '')
      .join('\n');
  }

  private renderListItem(item: ListItemNode, level: number, position?: number): string {
    const indent = '  '.repeat(level);
    const bullet = position === undefined ? '- ' : `${position}. `;
    // A nested list continues the item rather than starting a new block, so it
    // keeps its own indentation and follows on the very next line.
    const nested: string[] = [];
    const content: string[] = [];

    for (const child of item.children) {
      if (child.type === 'list') {
        nested.push(this.renderList(child, level + 1));
        continue;
      }
      const rendered = this.renderBlock(child, level + 1);
      if (rendered !== '') {
        content.push(rendered);
      }
    }

    const body = joinBlocks(content);
    if (body === '' && nested.length === 0) {
      return '';
    }
    const head = `${indent}${bullet}${indentRest(body, `${indent}  `)}`;

    return [head, ...nested.filter((part) => part !== '')].join('\n');
  }

  private renderQuote(block: QuoteNode, level: number): string {
    const body = joinBlocks(this.renderBlocks(block.children, level));

    if (body === '') {
      return '';
    }
    return block.author ? `${block.author}: ${body}` : body;
  }

  /** Renders a table as one line per row. */
  private renderTable(block: TableNode): string {
    return block.children
      .map((row) =>
        row.children
          .map((cell) => flatten(joinBlocks(this.renderBlocks(cell.children, 0))))
          .filter((cell) => cell !== '')
          .join(this.options.cellSeparator),
      )
      .filter((row) => row !== '')
      .join('\n');
  }

  private renderInline(nodes: InlineNode[]): string {
    return nodes.map((node) => this.renderInlineNode(node)).join('');
  }

  private renderInlineNode(node: InlineNode): string {
    switch (node.type) {
      case 'text':
      case 'inlineCode':
        return node.value;
      case 'break':
        return '\n';
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
      case 'spoiler':
        return this.renderInline(node.children);
      case 'image':
        return node.alt ?? '';
      case 'link':
      case 'video': {
        const label = this.renderInline(node.children);
        return label.trim() === '' ? node.url : label;
      }
    }
  }
}

/** Renders a document as plain, unformatted text.
 *
 * @param root - The tree to render.
 * @param options - Rendering overrides.
 */
export default function renderPlain(root: RootNode, options: PlainRenderOptions = {}): string {
  return new Renderer(options).render(root);
}
