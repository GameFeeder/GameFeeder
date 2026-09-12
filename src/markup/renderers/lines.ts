/** Line handling shared by the renderers.
 *
 * Every target lays blocks out the same way — one blank line between them, a
 * prefix or an indent on each line of a nested one — and differs only in what
 * the prefix is. These helpers hold the part that does not differ.
 */

/** Puts a prefix on every line of a rendered block.
 *
 * @param text - The rendered block.
 * @param prefix - What to put on each line.
 * @param blankPrefix - What to put on lines that are empty, if not `prefix`.
 */
export function prefixLines(text: string, prefix: string, blankPrefix = prefix.trimEnd()): string {
  return text
    .split('\n')
    .map((line) => (line.trim() === '' ? blankPrefix : `${prefix}${line}`))
    .join('\n');
}

/** Indents every line of a rendered block except the first.
 *
 * The first line belongs to whatever introduced the block — a list bullet, say
 * — so it is already positioned.
 *
 * @param text - The rendered block.
 * @param indent - The indent to apply.
 */
export function indentRest(text: string, indent: string): string {
  const [first, ...rest] = text.split('\n');

  return [first, ...rest.map((line) => (line.trim() === '' ? '' : `${indent}${line}`))].join('\n');
}

/** Joins rendered blocks with a blank line, dropping the ones that came out empty. */
export function joinBlocks(blocks: string[]): string {
  return blocks.filter((block) => block !== '').join('\n\n');
}

/** Tidies a finished document: no trailing spaces, no runs of blank lines. */
export function tidy(text: string): string {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Collapses a rendered fragment onto a single line. */
export function flatten(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ').trim();
}

/** Wraps a rendered fragment in emphasis markers.
 *
 * Whitespace is moved outside the markers and empty emphasis is dropped, so
 * that the markers always sit against the text they apply to.
 *
 * @param rendered - The already rendered fragment.
 * @param marker - The marker to put on each side.
 */
export function wrap(rendered: string, marker: string): string {
  const core = rendered.trim();

  if (core === '') {
    return '';
  }
  const lead = /^\s/.test(rendered) ? ' ' : '';
  const trail = /\s$/.test(rendered) ? ' ' : '';

  return `${lead}${marker}${core}${marker}${trail}`;
}
