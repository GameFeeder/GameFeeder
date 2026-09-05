import type {
  BlockNode,
  InlineNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  QuoteNode,
  RootNode,
  TableNode,
} from './ast.js';
import { encodeMarkdownUrl, escapeMarkdownLabel, resolveSteamUrl } from './url.js';

/** Options for {@link renderMarkdown}. */
export type MarkdownRenderOptions = {
  /** The label used for images. */
  imageLabel?: string;
  /** The label used for links whose text is empty. */
  linkLabel?: string;
  /** The string that separates the cells of a table row. */
  cellSeparator?: string;
};

const DEFAULTS = {
  imageLabel: 'Image',
  linkLabel: 'Link',
  cellSeparator: ' | ',
};

/** `https://store.steampowered.com/app/251570/7_Days_to_Die/` */
const STEAM_APP_URL = /\/app\/\d+\/([^/?#]+)/;

/** Collapses a rendered fragment onto a single line. */
function flatten(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ').trim();
}

/** Wraps text in emphasis markers, respecting what `MDRegex` is able to match.
 *
 * `MDRegex.boldAsterisk` and `MDRegex.italicAsterisk` reject line breaks and
 * whitespace next to the markers, so the whitespace is moved outside of them
 * and empty emphasis is dropped entirely.
 */
function emphasize(rendered: string, marker: string): string {
  const single = rendered.replace(/\s*\n\s*/g, ' ');
  const core = single.trim();

  if (core === '') {
    return '';
  }
  // Emphasis that already contains its own marker cannot be matched downstream.
  if (core.includes(marker)) {
    return single;
  }
  const lead = /^\s/.test(single) ? ' ' : '';
  const trail = /\s$/.test(single) ? ' ' : '';

  return `${lead}${marker}${core}${marker}${trail}`;
}

/** Derives a link label for tags that carry no text of their own, such as
 * `[dynamiclink]`. Steam store links become the app name, anything else becomes
 * a readable form of the URL itself.
 */
function labelFromUrl(url: string, fallback: string): string {
  const app = STEAM_APP_URL.exec(url);
  if (app) {
    const name = decodeURIComponent(app[1]).replace(/_/g, ' ').trim();
    if (name !== '') {
      return name;
    }
  }
  const readable = url
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');

  return readable === '' ? fallback : escapeMarkdownLabel(readable);
}

class Renderer {
  private readonly options: Required<MarkdownRenderOptions>;

  constructor(options: MarkdownRenderOptions) {
    this.options = { ...DEFAULTS, ...options };
  }

  public render(root: RootNode): string {
    const markdown = this.renderBlocks(root.children, 0).join('\n\n');

    return markdown
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private renderBlocks(blocks: BlockNode[], level: number): string[] {
    return blocks.map((block) => this.renderBlock(block, level)).filter((text) => text !== '');
  }

  private renderBlock(block: BlockNode, level: number): string {
    switch (block.type) {
      case 'paragraph':
        return this.renderParagraph(block);
      case 'heading': {
        // Emphasis inside a heading breaks both bots, which wrap headings in
        // their own markers, so the text is rendered plain.
        const text = flatten(this.renderInline(block.children, true));
        return text === '' ? '' : `${'#'.repeat(block.level)} ${text}`;
      }
      case 'list':
        return this.renderList(block, level);
      case 'quote':
        return this.renderQuote(block, level);
      case 'code':
        return `\`\`\`\n${block.value}\n\`\`\``;
      case 'table':
        return this.renderTable(block);
      case 'expand':
        return this.renderBlocks(block.children, level).join('\n\n');
      case 'separator':
        return '---';
    }
  }

  /** Renders a paragraph, giving images and videos a line of their own. */
  private renderParagraph(block: ParagraphNode): string {
    const segments: string[] = [];
    let text = '';

    for (const child of block.children) {
      if (child.type === 'image' || child.type === 'video') {
        if (text.trim() !== '') {
          segments.push(text.trim());
        }
        text = '';
        segments.push(this.renderInline([child], false));
        continue;
      }
      text += this.renderInline([child], false);
    }
    if (text.trim() !== '') {
      segments.push(text.trim());
    }
    return segments.filter((segment) => segment !== '').join('\n');
  }

  private renderList(block: ListNode, level: number): string {
    const lines = block.children
      .map((item, index) => this.renderListItem(item, level, block.ordered ? index + 1 : undefined))
      .filter((line) => line !== '');

    return lines.join('\n');
  }

  /** Renders one list entry.
   *
   * `MDRegex.list` only matches a bullet at the start of a line, so the entry's
   * first block has to fit on the bullet line; anything else is indented below.
   */
  private renderListItem(item: ListItemNode, level: number, position?: number): string {
    const indent = '  '.repeat(level);
    const bullet = position === undefined ? '- ' : `${position}. `;
    const nested: string[] = [];
    const content: string[] = [];

    for (const child of item.children) {
      if (child.type === 'list') {
        nested.push(this.renderList(child, level + 1));
        continue;
      }
      const rendered = this.renderBlock(child, level);
      if (rendered !== '') {
        content.push(rendered);
      }
    }

    const lines = content
      .join('\n')
      .split('\n')
      .filter((line) => line.trim() !== '');
    const head = lines.length > 0 ? lines[0].trim() : '';
    const body = lines.slice(1).map((line) => `${indent}  ${line.trim()}`);

    if (head === '' && body.length === 0 && nested.length === 0) {
      return '';
    }
    return [`${indent}${bullet}${head}`, ...body, ...nested].join('\n');
  }

  private renderQuote(block: QuoteNode, level: number): string {
    const body = this.renderBlocks(block.children, level).join('\n\n');
    const author = block.author ? `**${escapeMarkdownLabel(block.author)}**:\n` : '';

    return `${author}${body}`
      .split('\n')
      .map((line) => (line.trim() === '' ? '>' : `> ${line.trim()}`))
      .join('\n');
  }

  /** Renders a table as one line per row.
   *
   * Neither Discord nor Telegram renders markdown tables, so the grid is
   * flattened into readable lines instead of pipe syntax.
   */
  private renderTable(block: TableNode): string {
    const rows = block.children
      .map((row) =>
        row.children
          .map((cell) => {
            const text = flatten(this.renderBlocks(cell.children, 0).join(' '));
            return cell.header ? emphasize(text, '**') : text;
          })
          .filter((cell) => cell !== '')
          .join(this.options.cellSeparator),
      )
      .filter((row) => row !== '');

    return rows.join('\n');
  }

  private renderInline(nodes: InlineNode[], plain: boolean): string {
    return nodes.map((node) => this.renderInlineNode(node, plain)).join('');
  }

  private renderInlineNode(node: InlineNode, plain: boolean): string {
    switch (node.type) {
      case 'text':
        return node.value;
      case 'bold':
        return this.style(node.children, '**', plain);
      case 'italic':
        return this.style(node.children, '*', plain);
      // Neither bot has an equivalent for these, so only the text survives.
      case 'underline':
      case 'strike':
      case 'spoiler':
        return this.renderInline(node.children, plain);
      case 'image': {
        // In a link label or heading an image contributes no text of its own.
        if (plain) {
          return '';
        }
        const url = encodeMarkdownUrl(resolveSteamUrl(node.url));
        return url === '' ? '' : `![${this.options.imageLabel}](${url})`;
      }
      case 'video': {
        const label = node.url.includes('youtu') ? 'YouTube Video' : 'Video';
        return this.renderLink(node.url, node.children, plain, label);
      }
      case 'link':
        return this.renderLink(node.url, node.children, plain);
    }
  }

  private style(children: InlineNode[], marker: string, plain: boolean): string {
    const rendered = this.renderInline(children, plain);

    if (plain) {
      return rendered;
    }
    if (marker === '*' && rendered.includes('*')) {
      // `MDRegex.italicAsterisk` cannot contain an asterisk; try underscores.
      return rendered.includes('_') ? rendered : emphasize(rendered, '_');
    }
    return emphasize(rendered, marker);
  }

  private renderLink(
    rawUrl: string,
    children: InlineNode[],
    plain: boolean,
    /** Label to use when the tag carries no text. Derived from the URL if absent. */
    fallback?: string,
  ): string {
    const url = encodeMarkdownUrl(resolveSteamUrl(rawUrl));

    if (url === '') {
      return this.renderInline(children, plain);
    }

    // `[url=...][img]...[/img][/url]` is common and round-trips through
    // `MDRegex.replaceLinkImage` as long as it keeps this exact shape. Steam
    // often puts each tag on its own line, so surrounding whitespace is ignored.
    const meaningful = children.filter(
      (child) => child.type !== 'text' || child.value.trim() !== '',
    );
    const [only] = meaningful;
    if (meaningful.length === 1 && only.type === 'image') {
      const imageUrl = encodeMarkdownUrl(resolveSteamUrl(only.url));
      if (imageUrl !== '') {
        return `[![${this.options.imageLabel}](${imageUrl})](${url})`;
      }
    }

    const label = escapeMarkdownLabel(this.renderInline(children, true));
    if (label !== '') {
      return `[${label}](${url})`;
    }
    const derived = fallback ?? labelFromUrl(resolveSteamUrl(rawUrl), this.options.linkLabel);
    return `[${derived}](${url})`;
  }
}

/** Renders a parsed Steam post as markdown.
 *
 * The output targets the markdown dialect that `MDRegex` understands, because
 * `DiscordBot.msgFromMarkdown` and `TelegramBot.msgFromMarkdown` transcode it
 * from there into each platform's own syntax.
 *
 * @param root - The tree produced by the parser.
 * @param options - Rendering overrides.
 */
export default function renderMarkdown(
  root: RootNode,
  options: MarkdownRenderOptions = {},
): string {
  return new Renderer(options).render(root);
}
