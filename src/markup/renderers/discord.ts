import type {
  BlockNode,
  CodeNode,
  HeadingNode,
  ImageNode,
  InlineNode,
  ListItemNode,
  ListNode,
  QuoteNode,
  RootNode,
  TableNode,
  VideoNode,
} from '../ast.js';
import { escapeDiscord, escapeDiscordLineStart, sanitizeUrl } from '../escape.js';
import { flatten, indentRest, joinBlocks, prefixLines, tidy, wrap } from './lines.js';

/** Options for {@link renderDiscord}. */
export type DiscordRenderOptions = {
  /** Whether `[label](url)` links render.
   *
   * Discord resolves them inside an embed but shows the raw markup in an
   * ordinary message, which needs the URL spelled out instead.
   */
  masked?: boolean;
  /** The label used for images that carry no alt text. */
  imageLabel?: string;
  /** The label used for links whose text is empty. */
  linkLabel?: string;
  /** The string that separates the cells of a table row. */
  cellSeparator?: string;
};

const DEFAULTS = {
  masked: false,
  imageLabel: 'Image',
  linkLabel: 'Link',
  cellSeparator: ' | ',
};

/** The deepest heading Discord renders as a heading of its own. */
const MAX_NATIVE_HEADING = 3;

/** What is being rendered around the current node.
 *
 * Discord resolves neither a link inside a link nor emphasis inside the same
 * emphasis, so both have to be dropped rather than nested.
 */
type Context = {
  inLink: boolean;
  inBold: boolean;
  inItalic: boolean;
};

const ROOT_CONTEXT: Context = { inLink: false, inBold: false, inItalic: false };

/** Picks a backtick run long enough to hold the given code. */
function fenceFor(value: string, minimum: number): string {
  const runs = value.match(/`+/g) ?? [];
  const longest = runs.reduce((max, run) => Math.max(max, run.length), minimum - 1);

  return '`'.repeat(longest + 1);
}

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

class Renderer {
  private readonly options: Required<DiscordRenderOptions>;

  constructor(options: DiscordRenderOptions) {
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
        return this.defuseLines(this.renderParagraph(block.children, ROOT_CONTEXT));
      case 'heading':
        return this.renderHeading(block);
      case 'list':
        return this.renderList(block, level);
      case 'quote':
        return this.renderQuote(block, level);
      case 'code':
        return this.renderCode(block);
      case 'table':
        return this.renderTable(block);
      case 'separator':
        return '---';
    }
  }

  /** Defuses the markup Discord reads at the start of a line.
   *
   * A paragraph that happens to begin with `- ` or `# ` is prose, not a list or
   * a heading. The prefixes the renderer adds itself are applied afterwards, so
   * they are never caught by this.
   */
  private defuseLines(rendered: string): string {
    return rendered
      .split('\n')
      .map((line) => escapeDiscordLineStart(line))
      .join('\n');
  }

  /** Renders an inline run as one line of a heading or a cell. */
  private renderLines(nodes: InlineNode[], context: Context): string {
    return this.defuseLines(this.renderInline(nodes, context));
  }
  /** Renders a paragraph, giving media a line of its own.
   *
   * A post that opens with a banner and runs straight into its first sentence
   * is common, and a link sitting flush against the prose reads badly.
   */
  private renderParagraph(nodes: InlineNode[], context: Context): string {
    const segments: string[] = [];
    let run = '';

    for (const child of nodes) {
      if (child.type === 'image' || child.type === 'video') {
        if (run.trim() !== '') {
          segments.push(run.trim());
        }
        run = '';
        segments.push(this.renderInlineNode(child, context));
        continue;
      }
      run += this.renderInlineNode(child, context);
    }
    if (run.trim() !== '') {
      segments.push(run.trim());
    }
    return segments.filter((segment) => segment !== '').join('\n');
  }

  private renderHeading(block: HeadingNode): string {
    if (block.level <= MAX_NATIVE_HEADING) {
      // A heading already reads as bold, so bold inside one adds only markers.
      const text = flatten(this.renderLines(block.children, { ...ROOT_CONTEXT, inBold: true }));
      return text === '' ? '' : `${'#'.repeat(block.level)} ${text}`;
    }
    // Discord has no heading this deep, so it becomes bold text of its own.
    const text = flatten(this.renderLines(block.children, { ...ROOT_CONTEXT, inBold: true }));
    return text === '' ? '' : `**${text}**`;
  }

  private renderCode(block: CodeNode): string {
    const fence = fenceFor(block.value, 3);
    const language = block.language ?? '';

    return `${fence}${language}\n${block.value}\n${fence}`;
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
    // `expandable` means the source hid this behind a summary. Neither target
    // can collapse a section, and the content is not a quotation, so it is
    // shown as ordinary content rather than misrepresented as one.
    if (block.expandable && !block.author) {
      return body;
    }
    const author = block.author ? `**${escapeDiscord(block.author)}**:\n` : '';

    return prefixLines(`${author}${body}`, '> ');
  }

  /** Renders a table as one line per row.
   *
   * Discord renders no table markup, so the grid is flattened into readable
   * lines instead of pipe syntax.
   */
  private renderTable(block: TableNode): string {
    return block.children
      .map((row) =>
        row.children
          .map((cell) => {
            const text = flatten(joinBlocks(this.renderBlocks(cell.children, 0)));
            return cell.header ? wrap(text, '**') : text;
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

  private renderInlineNode(node: InlineNode, context: Context): string {
    switch (node.type) {
      case 'text':
        return escapeDiscord(node.value);
      case 'break':
        return '\n';
      case 'inlineCode': {
        const fence = fenceFor(node.value, 1);
        const pad = node.value.startsWith('`') || node.value.endsWith('`') ? ' ' : '';
        return `${fence}${pad}${node.value}${pad}${fence}`;
      }
      case 'bold':
        return context.inBold
          ? this.renderInline(node.children, context)
          : wrap(this.renderInline(node.children, { ...context, inBold: true }), '**');
      case 'italic':
        return context.inItalic
          ? this.renderInline(node.children, context)
          : wrap(this.renderInline(node.children, { ...context, inItalic: true }), '*');
      case 'underline':
        return wrap(this.renderInline(node.children, context), '__');
      case 'strike':
        return wrap(this.renderInline(node.children, context), '~~');
      case 'spoiler':
        return wrap(this.renderInline(node.children, context), '||');
      case 'image':
        return this.renderTarget(
          node.url,
          escapeDiscord(node.alt ?? ''),
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
            const destination = this.options.masked
              ? `[${escapeDiscord(this.options.linkLabel)}](${target})`
              : target;
            return `${shown} (${destination})`;
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
    const url = sanitizeUrl(rawUrl);
    const label = flatten(rendered) || escapeDiscord(fallback);

    if (url === '') {
      return label;
    }
    // A link inside a link cannot render, so only its text survives.
    if (context.inLink) {
      return label;
    }
    // Discord refuses to mask a link whose text is the URL itself and prints
    // the markup verbatim instead. Spelling the URL out twice is no better, so
    // either way a bare URL is sent: Discord links that on its own.
    if (label === url || label === escapeDiscord(url)) {
      return url;
    }
    return this.options.masked ? `[${label}](${url})` : `${label} (${url})`;
  }
}

/** Renders a document as Discord markdown.
 *
 * @param root - The tree to render.
 * @param options - Rendering overrides.
 */
export default function renderDiscord(root: RootNode, options: DiscordRenderOptions = {}): string {
  return new Renderer(options).render(root);
}
