/** Making arbitrary text safe to put into each target's markup.
 *
 * A renderer decides what a node *means*; these functions make sure the text it
 * carries cannot be mistaken for markup on the way out. Everything a source
 * gives us is untrusted in this sense — a patch note that mentions `2 * 3` or a
 * game called `Half-Life 2: Episode_One` must not silently turn into emphasis.
 */

/** Characters Discord treats as markup wherever they appear.
 *
 * Parentheses are deliberately absent: they only mean anything as part of
 * `](...)`, and since the brackets are escaped, text can never form a link.
 * Escaping them as well would litter ordinary prose with backslashes.
 */
const DISCORD_INLINE = /[\\*_~`|[\]]/g;

/** Markup Discord only recognizes at the start of a line: headings, quotes,
 * bullets and numbered items.
 */
const DISCORD_LINE_START = /^([ \t]*)([#>+-]|\d+[.)])/;

/** Schemes a link is allowed to use. Anything else is dropped entirely. */
const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/** Characters that break a URL, or the markup around it, if left as they are. */
const URL_UNSAFE = /[\s<>"'\\^`{|}]/g;

/** Escapes text for Discord's markdown.
 *
 * Discord honours a backslash before any of its markup characters, so nothing
 * has to be rewritten or dropped and the text reaches the reader intact.
 *
 * @param value - The literal text to show.
 */
export function escapeDiscord(value: string): string {
  return value.replace(DISCORD_INLINE, (char) => `\\${char}`);
}

/** Escapes the markup Discord only recognises at the start of a line.
 *
 * Kept apart from {@link escapeDiscord} so that a hyphen or a `#` in the middle
 * of a sentence is left alone: escaping those everywhere would litter ordinary
 * prose such as `Half-Life` with backslashes.
 *
 * Apply this to a line of already rendered text, before any prefix the renderer
 * adds itself — a list bullet is markup we *want* Discord to read.
 *
 * @param line - One rendered line.
 */
export function escapeDiscordLineStart(line: string): string {
  return line.replace(DISCORD_LINE_START, (_match, indent, marker) => `${indent}\\${marker}`);
}

/** Telegram's legacy `Markdown` parse mode has no escape syntax, so a marker
 * that cannot be paired is a hard API error rather than a rendering glitch.
 * The only way to make arbitrary text safe is to replace the markers with
 * characters that look like them but carry no meaning.
 *
 * This table, and the function below, are the entire cost of staying on the
 * legacy parse mode: under `HTML` or `MarkdownV2` both collapse into ordinary
 * escaping and the substitutions go away.
 */
const TELEGRAM_LOOKALIKES: Record<string, string> = {
  // U+2217 ASTERISK OPERATOR
  '*': '\u2217',
  // U+02CD MODIFIER LETTER LOW MACRON
  _: '\u02cd',
  // U+02BC MODIFIER LETTER APOSTROPHE
  '`': '\u02bc',
  '[': '(',
  ']': ')',
};

const TELEGRAM_SPECIAL = /[*_`[\]]/g;

/** Makes text safe for Telegram's legacy `Markdown` parse mode.
 *
 * @param value - The literal text to show.
 */
export function sanitizeTelegramMarkdown(value: string): string {
  return value.replace(TELEGRAM_SPECIAL, (char) => TELEGRAM_LOOKALIKES[char] ?? char);
}

/** Makes a URL safe to put into a link.
 *
 * Unlike the markdown dialect this replaces, a tree leaves no doubt about where
 * a URL ends, so parentheses survive untouched; only characters that genuinely
 * cannot appear in a URL are encoded.
 *
 * @param url - The URL as the source gave it.
 * @returns The safe URL, or an empty string if it may not be linked to.
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  if (trimmed === '') {
    return '';
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Protocol-relative and root-relative URLs have no scheme to distrust, but
    // nothing downstream can resolve them either.
    return '';
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return '';
  }
  return trimmed.replace(URL_UNSAFE, (char) => encodeURIComponent(char));
}
