/** Cleanup that every parser runs before its tree reaches a renderer.
 *
 * Sources disagree about how much structural noise they emit — Steam splits a
 * single list into a run of one-item lists, HTML feeds wrap everything in empty
 * paragraphs — and without a shared pass each renderer would have to defend
 * against all of it. Normalizing once means the renderers only handle trees
 * that are already in a sane shape.
 */

import type { BlockNode, InlineNode, RootNode } from './ast.js';

/** How many consecutive line breaks may separate two lines of a block.
 *
 * More than this reads as a paragraph boundary, which is a block-level concern.
 */
const MAX_CONSECUTIVE_BREAKS = 2;

/** Determines whether an inline node contributes anything visible. */
function isBlankInline(node: InlineNode): boolean {
  if (node.type === 'break') {
    return true;
  }
  return node.type === 'text' && node.value.trim() === '';
}

/** Determines whether a block carries anything worth rendering. */
export function isEmptyBlock(block: BlockNode): boolean {
  switch (block.type) {
    case 'separator':
      return false;
    case 'code':
      return block.value.trim() === '';
    case 'paragraph':
    case 'heading':
      return !block.children.some((child) => !isBlankInline(child));
    default:
      return block.children.length === 0;
  }
}

/** Drops empty blocks and merges lists that a source split into chunks. */
export function normalizeBlocks(blocks: BlockNode[]): BlockNode[] {
  const result: BlockNode[] = [];

  for (const block of blocks) {
    if (isEmptyBlock(block)) {
      continue;
    }
    const previous = result[result.length - 1];

    if (previous?.type === 'list' && block.type === 'list' && previous.ordered === block.ordered) {
      previous.children.push(...block.children);
      continue;
    }
    result.push(block);
  }
  return result;
}

/** Removes the whitespace and line breaks surrounding a run of inline nodes. */
export function trimInline(nodes: InlineNode[]): InlineNode[] {
  const result = [...nodes];

  while (result.length > 0) {
    const first = result[0];
    if (first.type === 'break') {
      result.shift();
      continue;
    }
    if (first.type !== 'text') {
      break;
    }
    const value = first.value.replace(/^\s+/, '');
    if (value === '') {
      result.shift();
      continue;
    }
    result[0] = { type: 'text', value };
    break;
  }

  while (result.length > 0) {
    const last = result[result.length - 1];
    if (last.type === 'break') {
      result.pop();
      continue;
    }
    if (last.type !== 'text') {
      break;
    }
    const value = last.value.replace(/\s+$/, '');
    if (value === '') {
      result.pop();
      continue;
    }
    result[result.length - 1] = { type: 'text', value };
    break;
  }
  return result;
}

/** Caps runs of consecutive line breaks within a block. */
function collapseBreaks(nodes: InlineNode[]): InlineNode[] {
  const result: InlineNode[] = [];
  let run = 0;

  for (const node of nodes) {
    if (node.type === 'break') {
      run += 1;
      if (run > MAX_CONSECUTIVE_BREAKS) {
        continue;
      }
    } else if (node.type !== 'text' || node.value.trim() !== '') {
      run = 0;
    }
    result.push(node);
  }
  return result;
}

/** Normalizes a run of inline nodes and their descendants.
 *
 * Only the outermost run is trimmed. The space in `a<b> text </b>b` belongs to
 * the sentence, not to the emphasis, and a renderer moves it outside the
 * markers; trimming it here would run the words together instead.
 */
function normalizeInline(nodes: InlineNode[], blockLevel: boolean): InlineNode[] {
  const walked = nodes.map((node) => {
    switch (node.type) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
      case 'spoiler':
      case 'link':
      case 'video':
        return { ...node, children: normalizeInline(node.children, false) };
      default:
        return node;
    }
  });
  const collapsed = collapseBreaks(walked);

  return blockLevel ? trimInline(collapsed) : collapsed;
}

/** Normalizes a block and everything below it. */
function normalizeBlock(block: BlockNode): BlockNode {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return { ...block, children: normalizeInline(block.children, true) };
    case 'quote':
      return { ...block, children: normalizeBlocks(block.children.map(normalizeBlock)) };
    case 'list':
      return {
        ...block,
        // An item that holds nothing would render as a stray bullet.
        children: block.children
          .map((item) => ({
            ...item,
            children: normalizeBlocks(item.children.map(normalizeBlock)),
          }))
          .filter((item) => item.children.length > 0),
      };
    case 'table':
      return {
        ...block,
        children: block.children.map((tableRow) => ({
          ...tableRow,
          children: tableRow.children.map((tableCell) => ({
            ...tableCell,
            children: normalizeBlocks(tableCell.children.map(normalizeBlock)),
          })),
        })),
      };
    default:
      return block;
  }
}

/** Puts a freshly parsed document into the shape the renderers expect.
 *
 * @param root - The tree produced by a parser.
 */
export default function normalize(root: RootNode): RootNode {
  return { type: 'root', children: normalizeBlocks(root.children.map(normalizeBlock)) };
}
