import type { BlockNode, InlineNode, ListItemNode, RootNode, TableRowNode } from './ast.js';
import { textContent } from './ast.js';
import normalize from './normalize.js';

/** Options for {@link limitDocument}. */
export type LimitOptions = {
  /** Marks the point the document was cut at. */
  indicator?: string;
};

const DEFAULTS = {
  indicator: '…',
};

/** What a blank line between two blocks costs against the budget. */
const BLOCK_SEPARATOR_COST = 2;

/** Where a sentence may end, for cutting a paragraph mid-way. */
const SENTENCE_END = /[.!?…](?:["'”’)\]]+)?\s/g;

/** Cuts text at the last sentence that fits, or failing that the last word.
 *
 * @param value - The text to cut.
 * @param budget - How many characters may remain.
 */
function cutText(value: string, budget: number): string {
  if (budget <= 0) {
    return '';
  }
  const head = value.slice(0, budget);

  // A cut that lands on a space already ends a whole word, so nothing is lost
  // by keeping it; looking for an earlier boundary would drop that last word.
  if (/\s/.test(value[budget] ?? '')) {
    return head.trimEnd();
  }

  let sentence = 0;
  for (const match of head.matchAll(SENTENCE_END)) {
    sentence = match.index + match[0].length;
  }
  if (sentence > 0) {
    return head.slice(0, sentence).trimEnd();
  }

  const word = head.lastIndexOf(' ');

  return (word > 0 ? head.slice(0, word) : head).trimEnd();
}

/** Shortens a document to fit a budget, by removing nodes rather than characters.
 *
 * Cutting rendered output can leave a link or an emphasis run half-written,
 * which is a broken message on Discord and a rejected one on Telegram. Cutting
 * the tree instead cannot: every mark that is opened is still closed, because
 * the thing that carries it either survives whole or is gone.
 */
class Limiter {
  private readonly indicator: string;
  private remaining: number;
  /** Whether anything has been dropped, so the indicator is owed. */
  private cut = false;
  /** Whether the indicator has been placed. */
  private marked = false;

  constructor(budget: number, options: Required<LimitOptions>) {
    this.indicator = options.indicator;
    // A document only reaches here because it has to be cut, so the indicator
    // is certain to be needed and is reserved rather than added on top.
    this.remaining = budget - this.indicator.length;
  }

  public limit(root: RootNode): RootNode {
    const children = this.limitBlocks(root.children);

    // A rule introduces what comes next, and nothing does any more.
    while (children[children.length - 1]?.type === 'separator') {
      children.pop();
    }
    // The cut may have fallen between two blocks rather than inside one, which
    // leaves nothing to hang the indicator off. Without this the reader has no
    // way to tell a shortened post from a complete one.
    if (this.cut && !this.marked && children.length > 0) {
      this.markLastBlock(children);
    }
    return normalize({ type: 'root', children });
  }

  /** Whether something of the given cost still fits. */
  private fits(cost: number): boolean {
    return cost <= this.remaining;
  }

  private spend(cost: number): void {
    this.remaining -= cost;
  }

  private limitBlocks(blocks: BlockNode[]): BlockNode[] {
    const result: BlockNode[] = [];

    for (const [index, block] of blocks.entries()) {
      if (this.cut) {
        break;
      }
      if (index > 0) {
        this.spend(BLOCK_SEPARATOR_COST);
      }
      const cost = textContent(block).length;

      if (this.fits(cost)) {
        this.spend(cost);
        result.push(block);
        continue;
      }
      const partial = this.limitBlock(block);
      if (partial) {
        result.push(partial);
      }
      this.cut = true;
      break;
    }
    return result;
  }

  /** Keeps as much of a block that does not fit as is worth keeping. */
  private limitBlock(block: BlockNode): BlockNode | undefined {
    switch (block.type) {
      case 'paragraph':
      case 'heading': {
        const children = this.limitInline(block.children, true);
        return children.length > 0 ? { ...block, children } : undefined;
      }
      case 'list': {
        const children = this.limitItems(block.children);
        return children.length > 0 ? { ...block, children } : undefined;
      }
      case 'quote': {
        const children = this.limitBlocks(block.children);
        return children.length > 0 ? { ...block, children } : undefined;
      }
      case 'table': {
        const children = this.limitRows(block.children);
        return children.length > 0 ? { ...block, children } : undefined;
      }
      // A partial code block is misleading rather than merely short, and a
      // separator on its own is not worth the space.
      case 'code':
      case 'separator':
        return undefined;
    }
  }

  /** Keeps the whole list items that fit, and drops the rest. */
  private limitItems(items: ListItemNode[]): ListItemNode[] {
    const result: ListItemNode[] = [];

    for (const item of items) {
      const cost = textContent(item).length + BLOCK_SEPARATOR_COST;

      if (!this.fits(cost)) {
        break;
      }
      this.spend(cost);
      result.push(item);
    }
    return result;
  }

  /** Keeps the whole table rows that fit, and drops the rest. */
  private limitRows(rows: TableRowNode[]): TableRowNode[] {
    const result: TableRowNode[] = [];

    for (const row of rows) {
      const cost = textContent(row).length + 1;

      if (!this.fits(cost)) {
        break;
      }
      this.spend(cost);
      result.push(row);
    }
    return result;
  }

  /** @param mark - Whether this run ends at the cut, and so owes the indicator. */
  private limitInline(nodes: InlineNode[], mark: boolean): InlineNode[] {
    const result: InlineNode[] = [];

    for (const node of nodes) {
      const cost = textContent(node).length;

      if (this.fits(cost)) {
        this.spend(cost);
        result.push(node);
        continue;
      }
      const partial = this.limitInlineNode(node);
      if (partial) {
        result.push(partial);
      }
      break;
    }
    return mark ? this.withIndicator(result) : result;
  }

  /** Keeps as much of an inline node that does not fit as still reads. */
  private limitInlineNode(node: InlineNode): InlineNode | undefined {
    switch (node.type) {
      case 'text': {
        const value = cutText(node.value, this.remaining);
        if (value === '') {
          return undefined;
        }
        this.spend(value.length);
        return { type: 'text', value };
      }
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
      case 'spoiler': {
        const children = this.limitInline(node.children, false);
        return children.length > 0 ? { ...node, children } : undefined;
      }
      // A half-written label on a link, or a lone marker, is worse than nothing.
      default:
        return undefined;
    }
  }

  /** Puts the indicator after the last block, whatever kind it is. */
  private markLastBlock(children: BlockNode[]): void {
    const last = children[children.length - 1];

    if (last.type === 'paragraph' || last.type === 'heading') {
      children[children.length - 1] = { ...last, children: this.withIndicator(last.children) };
      return;
    }
    children.push({ type: 'paragraph', children: [{ type: 'text', value: this.indicator }] });
    this.marked = true;
  }

  /** Marks the cut on the last piece of text that survived it. */
  private withIndicator(nodes: InlineNode[]): InlineNode[] {
    const last = nodes[nodes.length - 1];

    if (nodes.length > 0) {
      this.marked = true;
    }
    if (last?.type === 'text') {
      return [...nodes.slice(0, -1), { type: 'text', value: `${last.value}${this.indicator}` }];
    }
    return nodes.length > 0 ? [...nodes, { type: 'text', value: this.indicator }] : nodes;
  }
}

/** Shortens a document so that its text fits a budget.
 *
 * @param root - The tree to shorten.
 * @param budget - How many characters of text may remain.
 * @param options - Overrides.
 */
export default function limitDocument(
  root: RootNode,
  budget: number,
  options: LimitOptions = {},
): RootNode {
  if (textContent(root).length <= budget) {
    return root;
  }
  return new Limiter(budget, { ...DEFAULTS, ...options }).limit(root);
}

/** Renders a document as long as it can be while still fitting a hard limit.
 *
 * The budget {@link limitDocument} works against counts text, which is not what
 * a messenger counts: Discord counts the markers and URLs too, Telegram counts
 * neither. Rather than keep a cost model per target, the budget is searched for
 * and every candidate is measured as the exact string that would be sent.
 *
 * @param root - The tree to render.
 * @param render - How to render it for the target.
 * @param limit - The most characters the target accepts.
 */
export function fitDocument(
  root: RootNode,
  render: (tree: RootNode) => string,
  limit: number,
): string {
  const full = render(root);

  if (full.length <= limit) {
    return full;
  }

  let low = 0;
  let high = textContent(root).length;
  let best = '';

  while (low <= high) {
    const budget = Math.floor((low + high) / 2);
    const candidate = render(limitDocument(root, budget));

    if (candidate.length <= limit) {
      best = candidate;
      low = budget + 1;
    } else {
      high = budget - 1;
    }
  }
  return best;
}
