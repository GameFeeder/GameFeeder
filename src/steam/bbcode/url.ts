/** Base URL that Steam's clan image placeholders expand to. */
export const STEAM_CLAN_IMAGE_URL =
  'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans';

/** Placeholders Steam uses in image URLs. Both resolve to the same location. */
const CLAN_IMAGE_PLACEHOLDERS = /\{STEAM_CLAN_(?:LOC_)?IMAGE\}/g;

/** `https://steamcommunity.com/linkfilter/?url=<target>` wrappers. */
const LINK_FILTER = /^https?:\/\/steamcommunity\.com\/linkfilter\/\?url=(.*)$/;

/** Expands Steam's placeholders and unwraps its link filter.
 *
 * @param raw - The URL as it appears in the post.
 */
export function resolveSteamUrl(raw: string): string {
  let url = raw.trim();

  // Some posts wrap the URL in quotes on top of the tag syntax.
  if (url.length >= 2 && (url.startsWith('"') || url.startsWith("'"))) {
    const quote = url[0];
    if (url.endsWith(quote)) {
      url = url.slice(1, -1).trim();
    }
  }

  url = url.replace(CLAN_IMAGE_PLACEHOLDERS, STEAM_CLAN_IMAGE_URL);

  const filtered = LINK_FILTER.exec(url);
  if (filtered) {
    try {
      url = decodeURIComponent(filtered[1]);
    } catch {
      // Malformed percent-encoding: keep the target as-is rather than dropping it.
      url = filtered[1];
    }
  }

  return url;
}

/** Makes a URL safe to put inside `](...)`.
 *
 * `MDRegex.link` ends the URL at the first `)`, so parentheses and whitespace
 * have to be percent-encoded or the link falls apart downstream.
 *
 * @param url - The resolved URL.
 */
export function encodeMarkdownUrl(url: string): string {
  return url.replace(/[\s()]/g, (char) => {
    switch (char) {
      case '(':
        return '%28';
      case ')':
        return '%29';
      default:
        return '%20';
    }
  });
}

/** Makes a string safe to use as a markdown link label.
 *
 * `MDRegex.link` ends the label at the first `]` and does not match across
 * lines. Brackets are replaced rather than backslash-escaped because Telegram
 * sends with the legacy `Markdown` parse mode, which renders `\[` literally.
 *
 * @param label - The rendered label text.
 */
export function escapeMarkdownLabel(label: string): string {
  return label.replace(/\s+/g, ' ').replace(/\[/g, '(').replace(/\]/g, ')').trim();
}
