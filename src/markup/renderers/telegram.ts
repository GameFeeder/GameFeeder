import type {
  BlockNode,
  CodeNode,
  ImageNode,
  InlineNode,
  ListItemNode,
  ListNode,
  QuoteNode,
  RootNode,
  TableNode,
  VideoNode,
} from '../ast.js';
import { escapeTelegramHtml, sanitizeUrl } from '../escape.js';
import type { Segment } from './lines.js';
import { flatten, indentRest, joinBlocks, joinSegments, prefixLines, tidy, wrap } from './lines.js';

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

/** Renders a document for Telegram's `HTML` parse mode.
 *
 * That mode has every character style the tree does, links, code and quotes,
 * and lets them nest. Headings, lists, tables and rules have no representation
 * and are drawn out of ordinary characters.
 *
 * What it does not allow is enforced here rather than left to the API, which
 * rejects the whole message: a link may not contain a link, a quote may not
 * contain a quote, and nothing may be nested inside code. Every other `<`, `>`
 * and `&` has to be written as an entity — see `escapeTelegramHtml`.
 */

/** What is being rendered around the current inline node.
 *
 * Telegram cannot nest a link inside a link, and bold inside something already
 * bold only adds tags.
 */
type Context = {
  inLink: boolean;
  inBold: boolean;
};

const ROOT_CONTEXT: Context = { inLink: false, inBold: false };

/** The single image or video a node's children consist of, if that is all they are. */
function soleMedia(children: InlineNode[]): ImageNode | VideoNode | undefined {
  const meaningful = children.filter(
    (child) => child.type !== 'break' && (child.type !== 'text' || child.value.trim() !== ''),
  );
  const [only] = meaningful;

  return meaningful.length === 1 && (only.type === 'image' || only.type === 'video')
    ? only
    : undefined;
}

/** Renders a link, or only its label when it has nowhere safe to point. */
function anchor(url: string, label: string): string {
  return url === '' ? label : `<a href="${escapeTelegramHtml(url)}">${label}</a>`;
}

class Renderer {
  private readonly options: Required<TelegramRenderOptions>;

  constructor(options: TelegramRenderOptions) {
    this.options = { ...DEFAULTS, ...options };
  }

  public render(root: RootNode): string {
    return tidy(joinBlocks(this.renderBlocks(root.children, 0, false)));
  }

  /** @param inQuote - Whether a quote is already open, which cannot hold another. */
  private renderBlocks(blocks: BlockNode[], level: number, inQuote: boolean): string[] {
    return blocks
      .map((block) => this.renderBlock(block, level, inQuote))
      .filter((text) => text !== '');
  }

  private renderBlock(block: BlockNode, level: number, inQuote: boolean): string {
    switch (block.type) {
      case 'paragraph':
        return this.renderParagraph(block.children, ROOT_CONTEXT);
      case 'heading': {
        // Telegram has no headings, so one reads as a line of bold text.
        const text = flatten(this.renderInline(block.children, { ...ROOT_CONTEXT, inBold: true }));
        return wrap(text, '<b>', '</b>');
      }
      case 'list':
        return this.renderList(block, level, inQuote);
      case 'quote':
        return this.renderQuote(block, level, inQuote);
      case 'code':
        return this.renderCode(block);
      case 'table':
        return this.renderTable(block, inQuote);
      case 'separator':
        return '--';
    }
  }

  private renderCode(block: CodeNode): string {
    const value = escapeTelegramHtml(block.value);

    // Language names are identifiers such as `c++` or `f#`, and anything else
    // could break out of the attribute.
    const language = block.language?.replace(/[^\w+#.-]/g, '') ?? '';

    if (language !== '') {
      return `<pre><code class="language-${language}">${value}</code></pre>`;
    }
    return `<pre>${value}</pre>`;
  }

  private renderList(block: ListNode, level: number, inQuote: boolean): string {
    const start = block.start ?? 1;

    return block.children
      .map((item, index) =>
        this.renderListItem(item, level, inQuote, block.ordered ? start + index : undefined),
      )
      .filter((line) => line !== '')
      .join('\n');
  }

  private renderListItem(
    item: ListItemNode,
    level: number,
    inQuote: boolean,
    position?: number,
  ): string {
    const indent = '  '.repeat(level);
    const bullet = position === undefined ? this.options.bullet : `${position}. `;
    // A nested list continues the item rather than starting a new block, so it
    // keeps its own indentation and follows on the very next line.
    const nested: string[] = [];
    const content: string[] = [];

    for (const child of item.children) {
      if (child.type === 'list') {
        nested.push(this.renderList(child, level + 1, inQuote));
        continue;
      }
      const rendered = this.renderBlock(child, level + 1, inQuote);
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
   * `expandable` means the source hid this behind a summary, which Telegram can
   * do as well, so it becomes a quote the reader expands.
   *
   * Telegram rejects a quote inside a quote, so one that is nested falls back
   * to the leading `>` a quote is written with by hand.
   */
  private renderQuote(block: QuoteNode, level: number, inQuote: boolean): string {
    const body = joinBlocks(this.renderBlocks(block.children, level, true));

    if (body === '') {
      return '';
    }
    const author = block.author ? `<b>${escapeTelegramHtml(block.author)}</b>:\n` : '';

    if (inQuote) {
      // A collapsed section is not a quotation, and here it cannot collapse.
      return block.expandable && !block.author ? body : prefixLines(`${author}${body}`, '&gt; ');
    }
    const open = block.expandable ? '<blockquote expandable>' : '<blockquote>';

    return `${open}${author}${body}</blockquote>`;
  }

  /** Renders a table as one line per row. */
  private renderTable(block: TableNode, inQuote: boolean): string {
    return block.children
      .map((row) =>
        row.children
          .map((cell) => {
            const text = flatten(joinBlocks(this.renderBlocks(cell.children, 0, inQuote)));
            return cell.header ? wrap(text, '<b>', '</b>') : text;
          })
          .filter((cell) => cell !== '')
          .join(this.options.cellSeparator),
      )
      .filter((row) => row !== '')
      .join('\n');
  }

  private renderInline(nodes: InlineNode[], context: Context): string {
    return nodes.map((node) => this.renderInlineNode(node, context)).join('');
  }

  /** Renders a paragraph, giving media a line of its own.
   *
   * A post that opens with a banner and runs straight into its first sentence
   * is common, and a link sitting flush against the prose reads badly.
   */
  private renderParagraph(nodes: InlineNode[], context: Context): string {
    const segments: Segment[] = [];
    let run = '';

    for (const child of nodes) {
      if (child.type === 'image' || child.type === 'video') {
        if (run.trim() !== '') {
          segments.push({ media: false, text: run.trim() });
        }
        run = '';
        segments.push({ media: true, text: this.renderInlineNode(child, context) });
        continue;
      }
      run += this.renderInlineNode(child, context);
    }
    if (run.trim() !== '') {
      segments.push({ media: false, text: run.trim() });
    }
    return joinSegments(segments);
  }

  private renderInlineNode(node: InlineNode, context: Context): string {
    switch (node.type) {
      case 'text':
        return escapeTelegramHtml(node.value);
      case 'break':
        return '\n';
      case 'inlineCode':
        return node.value === '' ? '' : `<code>${escapeTelegramHtml(node.value)}</code>`;
      case 'bold':
        return context.inBold
          ? this.renderInline(node.children, context)
          : wrap(this.renderInline(node.children, { ...context, inBold: true }), '<b>', '</b>');
      case 'italic':
        return wrap(this.renderInline(node.children, context), '<i>', '</i>');
      case 'underline':
        return wrap(this.renderInline(node.children, context), '<u>', '</u>');
      case 'strike':
        return wrap(this.renderInline(node.children, context), '<s>', '</s>');
      case 'spoiler':
        return wrap(this.renderInline(node.children, context), '<tg-spoiler>', '</tg-spoiler>');
      case 'image':
        return this.renderTarget(
          node.url,
          escapeTelegramHtml(node.alt ?? ''),
          this.options.imageLabel,
          context,
        );
      case 'video': {
        const fallback = node.url.includes('youtu') ? 'YouTube Video' : 'Video';
        return this.renderTarget(
          node.url,
          this.renderInline(node.children, { ...context, inLink: true }),
          fallback,
          context,
        );
      }
      case 'link': {
        // A clickable banner, `[url=X][img]Y[/img][/url]`, is common in posts.
        // Keep both what it shows and where it points, rather than losing one.
        const media = soleMedia(node.children);
        if (media && !context.inLink) {
          const shown = this.renderInlineNode(media, context);
          const target = sanitizeUrl(node.url);

          if (shown !== '' && target !== '') {
            return `${shown} (${anchor(target, escapeTelegramHtml(this.options.linkLabel))})`;
          }
        }
        return this.renderTarget(
          node.url,
          this.renderInline(node.children, { ...context, inLink: true }),
          this.options.linkLabel,
          context,
        );
      }
    }
  }

  /** Renders anything that points at a URL.
   *
   * @param rawUrl - The URL as the source gave it.
   * @param rendered - The already rendered label, which may be empty.
   * @param fallback - The label to use when there is none.
   */
  private renderTarget(
    rawUrl: string,
    rendered: string,
    fallback: string,
    context: Context,
  ): string {
    const label = flatten(rendered) || escapeTelegramHtml(fallback);

    // A link inside a link cannot render, so only its text survives.
    return context.inLink ? label : anchor(sanitizeUrl(rawUrl), label);
  }
}

/** Renders a document for Telegram's `HTML` parse mode.
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

/** Measures a rendered message the way Telegram counts it against its limit.
 *
 * Telegram counts the text left after parsing, so tags cost nothing and an
 * entity costs one character. Counting UTF-16 units never undercounts it.
 *
 * Only meant for output of {@link renderTelegram}, which never leaves a bare
 * `<` outside a tag.
 *
 * @param html - The rendered message.
 */
export function telegramTextLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').replace(/&(?:lt|gt|quot|amp);/g, '_').length;
}
