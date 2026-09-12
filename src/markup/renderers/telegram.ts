import type {
  BlockNode,
  InlineNode,
  ListItemNode,
  ListNode,
  QuoteNode,
  RootNode,
  TableNode,
} from '../ast.js';
import { sanitizeTelegramMarkdown, sanitizeUrl } from '../escape.js';
import { flatten, indentRest, joinBlocks, prefixLines, tidy, wrap } from './lines.js';

/** Options for {@link renderTelegram}. */
export type TelegramRenderOptions = {
  /** The label used for images that carry no alt text. */
  imageLabel?: string;
  /** The label used for links whose text is empty. */
  linkLabel?: string;
  /** The bullet used for unordered lists. */
  bullet?: string;
  /** The string that separates the cells of a table row. */
  cellSeparator?: string;
};

const DEFAULTS = {
  imageLabel: 'Image',
  linkLabel: 'Link',
  bullet: '• ',
  cellSeparator: ' | ',
};

/** Renders a document for Telegram's legacy `Markdown` parse mode.
 *
 * That mode is deliberately thin: it has bold, italic, code and links, and
 * nothing else. Underline, strikethrough and spoilers have no representation at
 * all and degrade to plain text, and headings, lists, quotes and tables are
 * drawn out of ordinary characters.
 *
 * Two of its rules shape everything below. Entities may not nest, so any markup
 * inside an entity is dropped rather than nested; and there is no escape
 * syntax, so text is made safe by substituting lookalike characters for the
 * markers — see `sanitizeTelegramMarkdown`.
 *
 * Both constraints disappear under the `HTML` parse mode, which is why the
 * rendering decisions are kept here rather than spread across the bot.
 */
class Renderer {
  private readonly options: Required<TelegramRenderOptions>;

  constructor(options: TelegramRenderOptions) {
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
        return this.renderInline(block.children, false);
      case 'heading': {
        // Telegram has no headings, so one reads as a line of bold text.
        const text = flatten(this.renderInline(block.children, true));
        return wrap(text, '*');
      }
      case 'list':
        return this.renderList(block, level);
      case 'quote':
        return this.renderQuote(block, level);
      case 'code':
        return `\`\`\`\n${sanitizeTelegramMarkdown(block.value)}\n\`\`\``;
      case 'table':
        return this.renderTable(block);
      case 'separator':
        return '--';
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
    const bullet = position === undefined ? this.options.bullet : `${position}. `;
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

  /** Renders a quotation.
   *
   * Telegram renders no quote markup either, but a leading `>` is how a quote
   * is written by hand and reads as one even unstyled.
   */
  private renderQuote(block: QuoteNode, level: number): string {
    const body = joinBlocks(this.renderBlocks(block.children, level));

    if (body === '') {
      return '';
    }
    // `expandable` means the source hid this behind a summary. Neither target
    // can collapse a section, and the content is not a quotation, so it is
    // shown as ordinary content rather than misrepresented as one.
    if (block.expandable && !block.author) {
      return body;
    }
    const author = block.author ? `${wrap(sanitizeTelegramMarkdown(block.author), '*')}:\n` : '';

    return prefixLines(`${author}${body}`, '> ');
  }

  /** Renders a table as one line per row. */
  private renderTable(block: TableNode): string {
    return block.children
      .map((row) =>
        row.children
          .map((cell) => {
            const text = flatten(joinBlocks(this.renderBlocks(cell.children, 0)));
            return cell.header ? wrap(text, '*') : text;
          })
          .filter((cell) => cell !== '')
          .join(this.options.cellSeparator),
      )
      .filter((row) => row !== '')
      .join('\n');
  }

  /** Renders a run of inline nodes.
   *
   * @param plain - Whether an entity is already open, so no marker may be
   *   emitted. Telegram rejects a message whose entities nest.
   */
  private renderInline(nodes: InlineNode[], plain: boolean): string {
    return nodes.map((node) => this.renderInlineNode(node, plain)).join('');
  }

  private renderInlineNode(node: InlineNode, plain: boolean): string {
    switch (node.type) {
      case 'text':
        return sanitizeTelegramMarkdown(node.value);
      case 'break':
        return '\n';
      case 'inlineCode': {
        const value = sanitizeTelegramMarkdown(node.value);
        return plain ? value : `\`${value}\``;
      }
      case 'bold': {
        const rendered = this.renderInline(node.children, true);
        return plain ? rendered : wrap(rendered, '*');
      }
      case 'italic': {
        const rendered = this.renderInline(node.children, true);
        return plain ? rendered : wrap(rendered, '_');
      }
      // Telegram's legacy mode has no equivalent, so only the text survives.
      case 'underline':
      case 'strike':
      case 'spoiler':
        return this.renderInline(node.children, plain);
      case 'image':
        return this.renderTarget(node.url, node.alt ?? '', this.options.imageLabel, plain);
      case 'video': {
        const fallback = node.url.includes('youtu') ? 'YouTube Video' : 'Video';
        return this.renderTarget(node.url, this.renderInline(node.children, true), fallback, plain);
      }
      case 'link':
        return this.renderTarget(
          node.url,
          this.renderInline(node.children, true),
          this.options.linkLabel,
          plain,
        );
    }
  }

  /** Renders anything that points at a URL. */
  private renderTarget(rawUrl: string, rendered: string, fallback: string, plain: boolean): string {
    const url = sanitizeUrl(rawUrl);
    const label = flatten(rendered) || sanitizeTelegramMarkdown(fallback);

    if (url === '' || plain) {
      return label;
    }
    return `[${label}](${url})`;
  }
}

/** Renders a document for Telegram's legacy `Markdown` parse mode.
 *
 * @param root - The tree to render.
 * @param options - Rendering overrides.
 */
export default function renderTelegram(
  root: RootNode,
  options: TelegramRenderOptions = {},
): string {
  return new Renderer(options).render(root);
}
