import type { BlockNode, ImageNode, InlineNode, ParagraphNode, RootNode } from './ast.js';
import normalize from './normalize.js';

/** A document with its cover image lifted out, if it had one. */
export type CoverImage = {
  /** The document without the image. */
  document: RootNode;
  /** The image that opened or closed the document. */
  image?: ImageNode;
};

/** Whether an inline node contributes nothing a reader would see. */
function isBlank(node: InlineNode): boolean {
  return node.type === 'break' || (node.type === 'text' && node.value.trim() === '');
}

/** What is left of a paragraph once an image is taken from it, if anything. */
function remainder(block: ParagraphNode, children: InlineNode[]): ParagraphNode | undefined {
  return children.some((child) => !isBlank(child)) ? { ...block, children } : undefined;
}

/** The index of the last node a reader would see, or -1 if there is none. */
function lastVisibleIndex(nodes: InlineNode[]): number {
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    if (!isBlank(nodes[index])) {
      return index;
    }
  }
  return -1;
}

/** Takes the image a block opens with, if it opens with one. */
function takeLeading(block: BlockNode): { image: ImageNode; rest?: BlockNode } | undefined {
  if (block.type !== 'paragraph') {
    return undefined;
  }
  const index = block.children.findIndex((child) => !isBlank(child));
  const first = block.children[index];

  if (first?.type !== 'image') {
    return undefined;
  }
  return { image: first, rest: remainder(block, block.children.slice(index + 1)) };
}

/** Takes the image a block closes with, if it closes with one. */
function takeTrailing(block: BlockNode): { image: ImageNode; rest?: BlockNode } | undefined {
  if (block.type !== 'paragraph') {
    return undefined;
  }
  const index = lastVisibleIndex(block.children);
  const last = block.children[index];

  if (last?.type !== 'image') {
    return undefined;
  }
  return { image: last, rest: remainder(block, block.children.slice(0, index)) };
}

/** Lifts the image a document opens or closes with out of it.
 *
 * Posts very often lead with a banner or end on a picture. A messenger that has
 * a slot for an image of its own shows it far better there than as a link in
 * the text, and the text reads better without it.
 *
 * Only an image that stands on its own qualifies. One inside a link is a
 * clickable banner, and lifting it out would lose where it points.
 *
 * @param root - The document to take the image from.
 */
export default function extractCoverImage(root: RootNode): CoverImage {
  const blocks = root.children;

  if (blocks.length === 0) {
    return { document: root };
  }

  // The opening image is the likelier banner, so it wins over a closing one.
  const leading = takeLeading(blocks[0]);
  if (leading) {
    const rest = leading.rest ? [leading.rest] : [];
    return {
      document: normalize({ type: 'root', children: [...rest, ...blocks.slice(1)] }),
      image: leading.image,
    };
  }

  const trailing = takeTrailing(blocks[blocks.length - 1]);
  if (trailing) {
    const rest = trailing.rest ? [trailing.rest] : [];
    return {
      document: normalize({ type: 'root', children: [...blocks.slice(0, -1), ...rest] }),
      image: trailing.image,
    };
  }

  return { document: root };
}
